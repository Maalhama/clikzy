#!/bin/bash
source .env.local

PROMPT="$1"

curl -s https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "{\"model\":\"dall-e-3\",\"prompt\":\"$PROMPT\",\"n\":1,\"size\":\"1024x1024\",\"quality\":\"hd\"}" | jq -r '.data[0].url // .error'
