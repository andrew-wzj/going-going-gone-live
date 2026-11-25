FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/GoingGoingGone.Live/GoingGoingGone.Live.csproj src/GoingGoingGone.Live/
RUN dotnet restore src/GoingGoingGone.Live/GoingGoingGone.Live.csproj
COPY src/ src/
RUN dotnet publish src/GoingGoingGone.Live -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENV PORT=10000 DOTNET_CLI_TELEMETRY_OPTOUT=1
EXPOSE 10000
USER $APP_UID
ENTRYPOINT ["dotnet", "GoingGoingGone.Live.dll"]
