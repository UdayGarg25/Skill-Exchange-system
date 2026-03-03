"""
Offline profanity filter using better-profanity dictionary (thousands of words).

Usage:
    from app.services.moderation import check_content
    await check_content("some user text")  # raises HTTPException(400) if flagged

Rules:
  - If ANY profanity appears → reject entire request with HTTP 400
  - No sanitisation, no partial removal
  - Nothing stored in DB if blocked
  - Fully offline – no external API calls
"""

from fastapi import HTTPException
from better_profanity import profanity

# Load the full built-in profanity dictionary (thousands of words)
profanity.load_censor_words()


async def check_content(text: str) -> None:
    """
    Strict validation – raises HTTPException(400) when profanity is detected.
    Uses better-profanity's dictionary for broad coverage.
    Fully offline; no external service calls.
    """
    if not text or not text.strip():
        return

    if profanity.contains_profanity(text):
        raise HTTPException(
            status_code=400,
            detail="Inappropriate language detected. Please use respectful language.",
        )