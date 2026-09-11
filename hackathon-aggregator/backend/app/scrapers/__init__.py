"""Web scrapers package."""
from .base import BaseScraper
from .unstop import UnstopScraper
from .devfolio import DevfolioScraper

__all__ = ["BaseScraper", "UnstopScraper", "DevfolioScraper"]