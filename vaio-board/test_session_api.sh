#!/bin/bash
# Test script to check the session grid API endpoint
PORT=${1:-1888}  # Default to port 1888 if not specified
HOST=${2:-localhost}  # Default to localhost if not specified
TEST_TYPE=${3:-both}  # Options: both, get, put
USERNAME=${4:-admin}   # Default username
PASSWORD=${5:-admin}   # Default password

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== VAIO BOARD API TEST UTILITY ===${NC}"
echo -e "${YELLOW}HOST:${NC} $HOST"
echo -e "${YELLOW}PORT:${NC} $PORT"
echo -e "${YELLOW}TEST:${NC} $TEST_TYPE"
echo -e "${YELLOW}AUTH:${NC} $USERNAME / $(echo $PASSWORD | sed 's/./*/g')\n"

# Create a temporary JSON payload file
cat > /tmp/test_payload.json << EOL
{
  "grid_layout": {
    "lg": [
      {
        "i": "test-script-item",
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 8,
        "moduleType": "SYSTEM",
        "staticIdentifier": "TestScript"
      }
    ],
    "md": [],
    "sm": [],
    "xs": [],
    "xxs": []
  },
  "active_modules": ["SYSTEM-TestScript-shell"]
}
EOL

# First attempt to authenticate
echo -e "\n${GREEN}>>> Authenticating with the API${NC}"
echo -e "${YELLOW}URL:${NC} http://$HOST:$PORT/api/auth/token"
echo -e "${YELLOW}METHOD:${NC} POST"

# Create form data for authentication
echo -e "${YELLOW}FORM DATA:${NC} username=$USERNAME, password=******"
echo -e "\n${BLUE}-------------------------------------------------------------${NC}"

# Send login request to get authentication token/cookie
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  --cookie-jar /tmp/cookies.txt \
  -d "username=$USERNAME&password=$PASSWORD" \
  -v \
  "http://$HOST:$PORT/api/auth/token"

# Test PUT request to save grid layout
if [ "$TEST_TYPE" = "both" ] || [ "$TEST_TYPE" = "put" ]; then
  echo -e "\n${GREEN}>>> Testing PUT request to update grid layout${NC}"
  echo -e "${YELLOW}URL:${NC} http://$HOST:$PORT/api/user/session/grid"
  echo -e "${YELLOW}METHOD:${NC} PUT"
  echo -e "${YELLOW}HEADERS:${NC} Content-Type: application/json, Accept: application/json"
  echo -e "${YELLOW}PAYLOAD:${NC}"
  cat /tmp/test_payload.json
  echo -e "\n${BLUE}-------------------------------------------------------------${NC}"

  # Send the request and capture the response
  curl -X PUT \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    --cookie-jar /tmp/cookies.txt \
    --cookie /tmp/cookies.txt \
    -d @/tmp/test_payload.json \
    -v \
    "http://$HOST:$PORT/api/user/session/grid"
    
  # Check cookie file for debugging
  echo -e "\n${YELLOW}Cookies received:${NC}"
  cat /tmp/cookies.txt
fi

# Test GET request to fetch session data
if [ "$TEST_TYPE" = "both" ] || [ "$TEST_TYPE" = "get" ]; then
  echo -e "\n\n${GREEN}>>> Testing GET request to fetch current session data${NC}"
  echo -e "${YELLOW}URL:${NC} http://$HOST:$PORT/api/user/session"
  echo -e "${YELLOW}METHOD:${NC} GET"
  echo -e "${YELLOW}HEADERS:${NC} Accept: application/json"
  echo -e "\n${BLUE}-------------------------------------------------------------${NC}"

  curl -X GET \
    -H "Accept: application/json" \
    --cookie /tmp/cookies.txt \
    -v \
    "http://$HOST:$PORT/api/user/session"
    
  # Show session data in JSON format
  echo -e "\n\n${GREEN}>>> Fetching session data as formatted JSON${NC}"
  curl -s \
    -H "Accept: application/json" \
    --cookie /tmp/cookies.txt \
    "http://$HOST:$PORT/api/user/session" | python -m json.tool
fi

echo -e "\n\n${GREEN}>>> Test completed. Results shown above.${NC}"

# Clean up temporary files
rm /tmp/test_payload.json
