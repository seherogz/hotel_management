using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Wrappers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace CleanArchitecture.WebApi.Middlewares
{
    public class ErrorHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlerMiddleware> _logger;

        public ErrorHandlerMiddleware(RequestDelegate next, ILogger<ErrorHandlerMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception error)
            {
                _logger.LogError(error, "An error occurred while processing the request: {Message}", error.Message);
                
                var response = context.Response;
                response.ContentType = "application/json";
                var errorResponse = new ErrorResponse
                {
                    Message = error.Message,
                    Errors = new List<string> { error.ToString() }
                };

                switch (error)
                {
                    case ApiException e:
                        // Custom application error
                        response.StatusCode = (int)HttpStatusCode.BadRequest;
                        errorResponse.Message = e.Message;
                        break;
                        
                    case ValidationException e:
                        // Validation error
                        response.StatusCode = (int)HttpStatusCode.BadRequest;
                        errorResponse.Message = "Validation errors occurred";
                        errorResponse.Errors = e.Errors;
                        break;
                        
                    case EntityNotFoundException e:
                        // Not found error
                        response.StatusCode = (int)HttpStatusCode.NotFound;
                        errorResponse.Message = e.Message;
                        break;
                        
                    case KeyNotFoundException:
                        // Not found error
                        response.StatusCode = (int)HttpStatusCode.NotFound;
                        errorResponse.Message = "The requested resource was not found";
                        break;
                        
                    default:
                        // Unhandled error
                        response.StatusCode = (int)HttpStatusCode.InternalServerError;
                        errorResponse.Message = "An internal server error occurred";
                        
                        // Include detailed information for development environments
                        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                        {
                            errorResponse.Errors = new List<string> 
                            { 
                                error.ToString(),
                                error.StackTrace
                            };
                            
                            if (error.InnerException != null)
                            {
                                errorResponse.Errors.Add($"Inner Exception: {error.InnerException.Message}");
                                errorResponse.Errors.Add(error.InnerException.StackTrace);
                            }
                        }
                        break;
                }
                
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };
                
                var result = JsonSerializer.Serialize(errorResponse, jsonOptions);
                await response.WriteAsync(result);
            }
        }
    }
}