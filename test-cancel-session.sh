#!/bin/bash

# Script de test pour l'annulation de session
# Usage: ./test-cancel-session.sh [session_id] [auth_token]

# Configuration
API_BASE_URL="http://api.sue.alliance-tech.fr/api"
SESSION_ID=${1:-"test-session-id"}
AUTH_TOKEN=${2:-"test-token"}

echo "🧪 Test d'annulation de session"
echo "================================"
echo "Session ID: $SESSION_ID"
echo "API URL: $API_BASE_URL"
echo ""

# Test 1: Vérifier que l'endpoint existe (sans authentification)
echo "📡 Test 1: Vérification de l'endpoint (sans auth)"
echo "curl -X PATCH $API_BASE_URL/sessions/$SESSION_ID/cancel"
echo ""

curl -X PATCH \
  "$API_BASE_URL/sessions/$SESSION_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"status": "cancelled"}' \
  -w "\n\nStatus Code: %{http_code}\n" \
  -v

echo ""
echo "================================"
echo ""

# Test 2: Test avec authentification
echo "🔐 Test 2: Test avec authentification"
echo "curl -X PATCH $API_BASE_URL/sessions/$SESSION_ID/cancel -H 'Authorization: Bearer $AUTH_TOKEN'"
echo ""

curl -X PATCH \
  "$API_BASE_URL/sessions/$SESSION_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"status": "cancelled"}' \
  -w "\n\nStatus Code: %{http_code}\n" \
  -v

echo ""
echo "================================"
echo ""

# Test 3: Test avec un ID de session valide (si fourni)
if [ "$SESSION_ID" != "test-session-id" ]; then
  echo "✅ Test 3: Test avec ID de session réel"
  echo "Session ID réel: $SESSION_ID"
  echo ""
  
  curl -X PATCH \
    "$API_BASE_URL/sessions/$SESSION_ID/cancel" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"status": "cancelled"}' \
    -w "\n\nStatus Code: %{http_code}\n" \
    -v
fi

echo ""
echo "🏁 Tests terminés"


