"""M1 auth tables and RBAC seed (roles/permissions only — no user passwords).

Revision ID: 0002_m1_auth
Revises: 0001_academic_years
Create Date: 2026-09-05
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0002_m1_auth"
down_revision: Union[str, Sequence[str], None] = "0001_academic_years"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE app.roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )

    op.execute(
        """
        CREATE TABLE app.permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            kind TEXT NOT NULL,
            required_membership TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT permissions_kind_check
                CHECK (kind IN ('member_access', 'admin_capability')),
            CONSTRAINT permissions_required_membership_check
                CHECK (
                    required_membership IS NULL
                    OR required_membership IN ('ANY', 'RENEWED')
                ),
            CONSTRAINT permissions_kind_membership_check
                CHECK (
                    (kind = 'member_access'
                     AND required_membership IN ('ANY', 'RENEWED'))
                    OR
                    (kind = 'admin_capability' AND required_membership IS NULL)
                )
        )
        """
    )

    op.execute(
        """
        CREATE TABLE app.role_permissions (
            role_id UUID NOT NULL REFERENCES app.roles(id),
            permission_id UUID NOT NULL REFERENCES app.permissions(id),
            PRIMARY KEY (role_id, permission_id)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE app.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL,
            password_hash TEXT,
            activated_at TIMESTAMPTZ,
            is_active BOOLEAN NOT NULL DEFAULT true,
            locked_until TIMESTAMPTZ,
            deleted_at TIMESTAMPTZ,
            last_login_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        "CREATE UNIQUE INDEX users_email_lower ON app.users (lower(email))"
    )

    op.execute(
        """
        CREATE TABLE app.profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE REFERENCES app.users(id),
            full_name TEXT NOT NULL,
            student_number TEXT UNIQUE,
            degree_program TEXT,
            year_level TEXT,
            contact_number TEXT,
            batch TEXT,
            updated_by UUID REFERENCES app.users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )

    op.execute(
        """
        CREATE TABLE app.user_roles (
            user_id UUID NOT NULL REFERENCES app.users(id),
            role_id UUID NOT NULL REFERENCES app.roles(id),
            assigned_by UUID REFERENCES app.users(id),
            assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (user_id, role_id)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE app.membership_terms (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES app.users(id),
            academic_year_id UUID NOT NULL REFERENCES app.academic_years(id),
            status TEXT NOT NULL,
            renewed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT membership_terms_status_check
                CHECK (status IN ('PENDING', 'RENEWED', 'NOT_RENEWED')),
            CONSTRAINT membership_terms_user_year_key
                UNIQUE (user_id, academic_year_id)
        )
        """
    )
    op.execute(
        """
        CREATE INDEX membership_terms_academic_year_status
            ON app.membership_terms (academic_year_id, status)
        """
    )
    op.execute(
        "CREATE INDEX membership_terms_user_id ON app.membership_terms (user_id)"
    )

    op.execute(
        """
        CREATE TABLE app.sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX sessions_user_id ON app.sessions (user_id)")
    op.execute("CREATE INDEX sessions_expires_at ON app.sessions (expires_at)")

    op.execute(
        """
        CREATE TABLE app.auth_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
            purpose TEXT NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at TIMESTAMPTZ,
            attempt_count SMALLINT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT auth_tokens_purpose_check
                CHECK (purpose IN ('LOGIN_OTP', 'ACTIVATION', 'PASSWORD_RESET'))
        )
        """
    )
    op.execute(
        """
        CREATE INDEX auth_tokens_user_purpose_active
            ON app.auth_tokens (user_id, purpose, expires_at)
            WHERE used_at IS NULL
        """
    )

    op.execute(
        """
        CREATE TABLE app.auth_attempts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL,
            ip_address INET,
            attempt_type TEXT NOT NULL,
            success BOOLEAN NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT auth_attempts_type_check
                CHECK (attempt_type IN ('LOGIN', 'OTP', 'ACTIVATION'))
        )
        """
    )
    op.execute(
        """
        CREATE INDEX auth_attempts_email_created
            ON app.auth_attempts (email, created_at DESC)
        """
    )
    op.execute(
        """
        CREATE INDEX auth_attempts_ip_created
            ON app.auth_attempts (ip_address, created_at DESC)
        """
    )

    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO circuit_app")

    _seed_roles_and_permissions()


def _seed_roles_and_permissions() -> None:
    roles = [
        ("MEMBER", "Default member role"),
        ("SUPER_ADMIN", "Full portal administration"),
        ("RENEWALS_ADMIN", "Membership and renewals administration"),
        ("ACADEMIC_ADMIN", "Academic resources administration"),
        ("FINANCE_ADMIN", "Finance request types administration"),
        ("PUBLICITY_ADMIN", "Publicity request types administration"),
    ]
    for name, description in roles:
        op.execute(
            f"""
            INSERT INTO app.roles (name, description)
            VALUES ('{name}', '{description}')
            """
        )

    member_access = [
        ("view_dashboard", "View dashboard", "ANY"),
        ("view_own_profile", "View own profile", "ANY"),
        ("edit_own_profile", "Edit own profile fields", "ANY"),
        ("view_resources", "View organizational resources", "ANY"),
        ("view_academic_resources", "View academic drive", "RENEWED"),
        ("view_member_directory", "View member directory", "ANY"),
        ("view_request_directory", "View request directory", "ANY"),
        ("view_own_notifications", "View own notifications", "ANY"),
        ("view_renewal_info", "View renewal portal link", "ANY"),
    ]
    admin_capabilities = [
        ("view_admin_dashboard", "View admin dashboard"),
        ("view_members_admin", "View members admin"),
        ("manage_members", "Manage members"),
        ("manage_membership_status", "Manage membership status"),
        ("import_member_data", "Import member data"),
        ("manage_academic_resources", "Manage academic resources"),
        ("manage_organizational_resources", "Manage organizational resources"),
        ("manage_resource_categories", "Manage resource categories"),
        ("manage_finance_request_types", "Manage finance request types"),
        ("manage_publicity_request_types", "Manage publicity request types"),
        ("manage_all_request_types", "Manage all request types"),
        ("view_audit_logs", "View audit logs"),
        ("manage_roles", "Manage admin roles"),
    ]

    for name, description, required in member_access:
        op.execute(
            f"""
            INSERT INTO app.permissions (name, description, kind, required_membership)
            VALUES (
                '{name}', '{description}', 'member_access', '{required}'
            )
            """
        )

    for name, description in admin_capabilities:
        op.execute(
            f"""
            INSERT INTO app.permissions (name, description, kind, required_membership)
            VALUES ('{name}', '{description}', 'admin_capability', NULL)
            """
        )

    # Role → permission matrix (MVP seed from Section 5)
    matrix: dict[str, list[str]] = {
        "MEMBER": [
            "view_dashboard",
            "view_own_profile",
            "edit_own_profile",
            "view_resources",
            "view_academic_resources",
            "view_member_directory",
            "view_request_directory",
            "view_own_notifications",
            "view_renewal_info",
        ],
        "RENEWALS_ADMIN": [
            "view_admin_dashboard",
            "view_members_admin",
            "manage_members",
            "manage_membership_status",
            "import_member_data",
        ],
        "ACADEMIC_ADMIN": [
            "view_admin_dashboard",
            "manage_academic_resources",
            "manage_resource_categories",
        ],
        "FINANCE_ADMIN": [
            "view_admin_dashboard",
            "manage_finance_request_types",
        ],
        "PUBLICITY_ADMIN": [
            "view_admin_dashboard",
            "manage_publicity_request_types",
        ],
        "SUPER_ADMIN": [
            "view_admin_dashboard",
            "view_members_admin",
            "manage_members",
            "manage_membership_status",
            "import_member_data",
            "manage_academic_resources",
            "manage_organizational_resources",
            "manage_resource_categories",
            "manage_finance_request_types",
            "manage_publicity_request_types",
            "manage_all_request_types",
            "view_audit_logs",
            "manage_roles",
        ],
    }

    for role_name, permission_names in matrix.items():
        for perm_name in permission_names:
            op.execute(
                f"""
                INSERT INTO app.role_permissions (role_id, permission_id)
                SELECT r.id, p.id
                FROM app.roles r, app.permissions p
                WHERE r.name = '{role_name}' AND p.name = '{perm_name}'
                """
            )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS app.auth_attempts")
    op.execute("DROP TABLE IF EXISTS app.auth_tokens")
    op.execute("DROP TABLE IF EXISTS app.sessions")
    op.execute("DROP TABLE IF EXISTS app.membership_terms")
    op.execute("DROP TABLE IF EXISTS app.user_roles")
    op.execute("DROP TABLE IF EXISTS app.profiles")
    op.execute("DROP TABLE IF EXISTS app.users")
    op.execute("DROP TABLE IF EXISTS app.role_permissions")
    op.execute("DROP TABLE IF EXISTS app.permissions")
    op.execute("DROP TABLE IF EXISTS app.roles")
