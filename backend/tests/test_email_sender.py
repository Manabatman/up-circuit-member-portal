"""Regression: local OTP must be visible in the server console."""

from app.email.sender import ConsoleEmailSender


def test_console_email_sender_writes_otp_to_stderr(capsys) -> None:
    sender = ConsoleEmailSender()
    sender.send_login_otp(email="renewed.member@up.edu.ph", code="123456")

    captured = capsys.readouterr()
    assert "[OTP] login code for renewed.member@up.edu.ph: 123456" in captured.err
