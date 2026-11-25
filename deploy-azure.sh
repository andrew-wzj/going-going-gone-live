#!/usr/bin/env bash
# Deploy to Azure App Service (Linux, Free F1). Requires: az login.
# Usage: ./deploy-azure.sh [app-name] [region]
set -euo pipefail
APP=${1:-going-going-gone-live}
REGION=${2:-eastasia}
RG=ggg-live-rg
PLAN=ggg-live-plan
cd "$(dirname "$0")"
# Use the user-level install (~/.azcli) when az is not on PATH.
az() { if command -v az >/dev/null 2>&1 && [ "$(type -t az)" = file ]; then command az "$@"; else PYTHONWARNINGS=ignore "$HOME/.azcli/bin/az" "$@"; fi; }
export DOTNET_ROOT=${DOTNET_ROOT:-$HOME/.dotnet} PATH=$PATH:$HOME/.dotnet

az group create -n "$RG" -l "$REGION" -o none
az appservice plan create -g "$RG" -n "$PLAN" --is-linux --sku F1 -o none
if ! az webapp show -g "$RG" -n "$APP" -o none 2>/dev/null; then
  RUNTIME=$(az webapp list-runtimes --os linux -o tsv | grep -i '^DOTNETCORE:10' | head -1)
  az webapp create -g "$RG" -p "$PLAN" -n "$APP" --runtime "${RUNTIME:-DOTNETCORE:10.0}" -o none
fi
az webapp config set -g "$RG" -n "$APP" --web-sockets-enabled true --http20-enabled true -o none
az webapp update -g "$RG" -n "$APP" --https-only true -o none

rm -rf out deploy.zip
dotnet publish src/GoingGoingGone.Live -c Release -o out
(cd out && zip -qr ../deploy.zip .)
az webapp deploy -g "$RG" -n "$APP" --src-path deploy.zip --type zip
rm -rf out deploy.zip
echo "Live at https://$APP.azurewebsites.net/host.html"
