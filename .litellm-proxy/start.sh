#!/bin/bash
# 1. Replace with your actual OpenRouter API KEY
export OPENROUTER_API_KEY="sk-or-v1-..."

echo "Starting LiteLLM Proxy on port 4000..."
source venv/bin/activate
litellm --config litellm_config.yaml --port 4000
