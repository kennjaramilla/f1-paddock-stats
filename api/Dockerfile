FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY api/PaddockStats.Api.csproj api/
RUN dotnet restore api/PaddockStats.Api.csproj
COPY api/ api/
RUN dotnet publish api/PaddockStats.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# SQLite lives on a volume; the seed DB is copied there on first start.
ENV ASPNETCORE_URLS=http://+:8080 \
    Database__Path=/data/paddock.db
RUN mkdir /data && chown app /data
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "PaddockStats.Api.dll"]
