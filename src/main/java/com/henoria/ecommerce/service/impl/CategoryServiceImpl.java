package com.henoria.ecommerce.service.impl;

import com.henoria.ecommerce.dto.category.CategoryRequest;
import com.henoria.ecommerce.dto.category.CategoryResponse;
import com.henoria.ecommerce.entity.Category;
import com.henoria.ecommerce.entity.enums.Gender;
import com.henoria.ecommerce.exception.DuplicateResourceException;
import com.henoria.ecommerce.exception.ResourceNotFoundException;
import com.henoria.ecommerce.repository.CategoryRepository;
import com.henoria.ecommerce.repository.ProductRepository;
import com.henoria.ecommerce.repository.spec.ProductSpecification;
import com.henoria.ecommerce.service.CategoryService;
import com.henoria.ecommerce.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    public CategoryResponse create(CategoryRequest request) {
        String slug = request.getSlug() != null && !request.getSlug().isBlank()
                ? SlugUtil.toSlug(request.getSlug())
                : SlugUtil.toSlug(request.getName());

        if (categoryRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("A category with slug '" + slug + "' already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .slug(slug)
                .gender(Gender.valueOf(request.getGender().toUpperCase()))
                .parentSlug(request.getParentSlug())
                .image(request.getImage())
                .active(true)
                .build();

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Override
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            String newSlug = SlugUtil.toSlug(request.getSlug());
            if (!newSlug.equals(category.getSlug()) && categoryRepository.existsBySlug(newSlug)) {
                throw new DuplicateResourceException("A category with slug '" + newSlug + "' already exists");
            }
            category.setSlug(newSlug);
        }

        category.setName(request.getName());
        category.setGender(Gender.valueOf(request.getGender().toUpperCase()));
        category.setParentSlug(request.getParentSlug());
        category.setImage(request.getImage());

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Override
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        // soft delete so historical products/orders referencing it stay intact
        category.setActive(false);
        categoryRepository.save(category);
    }

    @Override
    public CategoryResponse getById(Long id) {
        return toResponse(categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id)));
    }

    @Override
    public CategoryResponse getBySlug(String slug) {
        return toResponse(categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug)));
    }

    @Override
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<CategoryResponse> getActive() {
        return categoryRepository.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    private CategoryResponse toResponse(Category category) {
        Specification<com.henoria.ecommerce.entity.Product> spec = Specification
                .where(ProductSpecification.isActive())
                .and(ProductSpecification.hasCategory(category.getSlug()));
        long productCount = productRepository.count(spec);

        return CategoryResponse.builder()
                .id(category.getId())
                .slug(category.getSlug())
                .name(category.getName())
                .gender(category.getGender() != null ? category.getGender().name() : null)
                .parentSlug(category.getParentSlug())
                .image(category.getImage())
                .productCount(productCount)
                .active(category.isActive())
                .build();
    }
}
