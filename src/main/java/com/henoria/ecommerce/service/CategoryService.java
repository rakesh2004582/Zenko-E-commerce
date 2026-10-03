package com.henoria.ecommerce.service;

import com.henoria.ecommerce.dto.category.CategoryRequest;
import com.henoria.ecommerce.dto.category.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse create(CategoryRequest request);
    CategoryResponse update(Long id, CategoryRequest request);
    void delete(Long id);
    CategoryResponse getById(Long id);
    CategoryResponse getBySlug(String slug);
    List<CategoryResponse> getAll();
    List<CategoryResponse> getActive();
}
