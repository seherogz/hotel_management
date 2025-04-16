FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CleanArchitecture/CleanArchitecture.WebApi/CleanArchitecture.WebApi.csproj", "CleanArchitecture/CleanArchitecture.WebApi/"]
COPY ["CleanArchitecture/CleanArchitecture.Infrastructure/CleanArchitecture.Infrastructure.csproj", "CleanArchitecture/CleanArchitecture.Infrastructure/"]
COPY ["CleanArchitecture/CleanArchitecture.Application/CleanArchitecture.Core.csproj", "CleanArchitecture/CleanArchitecture.Application/"]
RUN dotnet restore "CleanArchitecture/CleanArchitecture.WebApi/CleanArchitecture.WebApi.csproj"
COPY . .
WORKDIR "/src/CleanArchitecture/CleanArchitecture.WebApi"
RUN dotnet build "CleanArchitecture.WebApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CleanArchitecture.WebApi.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Veritabanı bağlantısı için bekleme mekanizması
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.9.0/wait /wait
RUN chmod +x /wait

ENTRYPOINT /wait && dotnet CleanArchitecture.WebApi.dll