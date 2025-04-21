using System;
using System.ComponentModel.DataAnnotations;

namespace CleanArchitecture.Core.Features.MaintenanceIssues.Commands.AddMaintenanceIssue;

public class AddMaintenanceIssueRequest
{
    [Required(ErrorMessage = "Issue description is required.")]
    [MaxLength(500, ErrorMessage = "Issue description cannot exceed 500 characters.")]
    public string IssueDescription { get; set; }

    [Required(ErrorMessage = "Estimated completion date is required.")]
    public DateTime EstimatedCompletionDate { get; set; }
}