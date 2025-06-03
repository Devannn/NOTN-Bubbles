#!/bin/bash

NTOPNG_HOST="192.168.1.148"
NTOPNG_PORT="3000"
USERNAME="admin"
PASSWORD="nN38vvDU"
IFID="1"

TMP_HOSTS=$(mktemp)
TMP_RESULTS=$(mktemp)

# Initialize results file with empty JSON object
echo "{}" > "$TMP_RESULTS"

curl -s -k -u "$USERNAME:$PASSWORD" "http://$NTOPNG_HOST:$NTOPNG_PORT/lua/rest/v2/get/host/active.lua?ifid=$IFID" | jq -r '.rsp.data[].ip' > "$TMP_HOSTS"

while read -r HOST_IP; do
    if [[ "$HOST_IP" =~ ^192\.168\..* ]]; then
        HOST_QUERY=$(curl -s -k -u "$USERNAME:$PASSWORD" "http://$NTOPNG_HOST:$NTOPNG_PORT/lua/rest/v2/get/host/l7/stats.lua?ifid=$IFID&host=$HOST_IP")

        if echo "$HOST_QUERY" | jq -e '.rsp != null and (.rsp | length > 0)' > /dev/null; then
            echo "$HOST_QUERY" | jq -r '.rsp[].label' | while read -r APP; do
                [[ -z "$APP" ]] && continue
                # Update the count for this app using jq
                if jq -e "has(\"$APP\")" "$TMP_RESULTS" > /dev/null; then
                    jq ".[\"$APP\"] += 1" "$TMP_RESULTS" > "$TMP_RESULTS.tmp" && mv "$TMP_RESULTS.tmp" "$TMP_RESULTS"
                else
                    jq ".[\"$APP\"] = 1" "$TMP_RESULTS" > "$TMP_RESULTS.tmp" && mv "$TMP_RESULTS.tmp" "$TMP_RESULTS"
                fi
            done
        fi
    fi
done < "$TMP_HOSTS"

# Output the final JSON
cat "$TMP_RESULTS"

# Cleanup
rm -f "$TMP_HOSTS" "$TMP_RESULTS"
