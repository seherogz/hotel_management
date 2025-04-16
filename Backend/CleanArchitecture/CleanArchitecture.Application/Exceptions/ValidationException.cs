using FluentValidation.Results;
using System;
using System.Collections.Generic;

namespace CleanArchitecture.Core.Exceptions
{
    public class ValidationException : Exception
    {
        public ValidationException() : base("One or more validation failures have occurred.")
        {
            Errors = new List<string>();
        }
        
        public ValidationException(string message) : base(message)
        {
            Errors = new List<string> { message };
        }
        
        public List<string> Errors { get; }
        
        public ValidationException(IEnumerable<ValidationFailure> failures)
            : this()
        {
            foreach (var failure in failures)
            {
                Errors.Add(failure.ErrorMessage);
            }
        }
    }
}
