using System.ComponentModel.DataAnnotations;

namespace ClinicaVeterinariaAPI.DTOs.Common;

public class PaginationParamsDto
{
    private const int MaxPageSize = 50;
    private int _pageSize = 10;

    [Range(1, int.MaxValue, ErrorMessage = "El número de página (Page) debe ser mayor o igual a 1.")]
    public int Page { get; set; } = 1;

    [Range(1, MaxPageSize, ErrorMessage = "El tamaño de página (PageSize) debe estar entre 1 y 50.")]
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }
}

