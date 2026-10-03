
package com.henoria.ecommerce.service.impl;

import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.product.ProductFilterRequest;
import com.henoria.ecommerce.dto.product.ProductRequest;
import com.henoria.ecommerce.dto.product.ProductResponse;
import com.henoria.ecommerce.entity.Category;
import com.henoria.ecommerce.entity.Inventory;
import com.henoria.ecommerce.entity.Product;
import com.henoria.ecommerce.entity.enums.Gender;
import com.henoria.ecommerce.exception.BadRequestException;
import com.henoria.ecommerce.exception.DuplicateResourceException;
import com.henoria.ecommerce.exception.ResourceNotFoundException;
import com.henoria.ecommerce.repository.CategoryRepository;
import com.henoria.ecommerce.repository.InventoryRepository;
import com.henoria.ecommerce.repository.ProductRepository;
import com.henoria.ecommerce.repository.spec.ProductSpecification;
import com.henoria.ecommerce.service.ProductService;
import com.henoria.ecommerce.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        validateProductRequest(request);

        Category category = getCategory(request.getCategorySlug());
        String slug = generateUniqueSlug(request.getSlug(), request.getName());

        Product product = buildProduct(request, category, slug);

        // Admin/platform-created products are approved by default.
        product.setApproved(true);
        product.setActive(true);

        product = productRepository.save(product);

        saveOrUpdateInventory(
                product,
                request.getSizeStock()
        );

        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse update(
            Long id,
            ProductRequest request
    ) {
        validateProductRequest(request);

        Product product = getProduct(id);
        Category category = getCategory(request.getCategorySlug());

        String newSlug = resolveUpdatedSlug(product, request);

        product.setName(request.getName().trim());
        product.setSlug(newSlug);
        product.setDescription(trimToNull(request.getDescription()));
        product.setPrice(request.getPrice());
        product.setDiscountPercent(
                request.getDiscountPercent() == null
                        ? 0.0
                        : request.getDiscountPercent()
        );
        product.setCategory(category);
        product.setGender(parseGender(request.getGender()));
        product.setColor(trimToNull(request.getColor()));
        product.setMaterial(trimToNull(request.getMaterial()));
        product.setBrand(trimToNull(request.getBrand()));
        product.setThumbnail(trimToNull(request.getThumbnail()));

        product.setFeatures(safeList(request.getFeatures()));
        product.setSizes(safeList(request.getSizes()));
        product.setImages(safeList(request.getImages()));
        product.setTags(safeList(request.getTags()));

        product.setFeatured(request.isFeatured());
        product.setNewArrival(request.isNewArrival());
        product.setTrending(request.isTrending());

        /*
         * finalPrice is recalculated by Product @PreUpdate,
         * but doing it here also makes the response immediately correct.
         */
        product.recalculateFinalPrice();

        product = productRepository.save(product);

        if (request.getSizeStock() != null) {
            saveOrUpdateInventory(
                    product,
                    request.getSizeStock()
            );
        }

        return toResponse(product);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Product product = getProduct(id);

        // Soft delete keeps old orders and reviews safe.
        product.setActive(false);

        productRepository.save(product);
    }

    @Override
    @Transactional
    public ProductResponse createAsSeller(
            Long sellerId,
            String sellerName,
            ProductRequest request
    ) {
        if (sellerId == null) {
            throw new BadRequestException(
                    "Seller id is required"
            );
        }

        validateProductRequest(request);

        Category category = getCategory(request.getCategorySlug());
        String slug = generateUniqueSlug(
                request.getSlug(),
                request.getName()
        );

        Product product = buildProduct(
                request,
                category,
                slug
        );

        product.setSellerId(sellerId);
        product.setSellerName(trimToNull(sellerName));

        /*
         * Seller products must be reviewed by admin before
         * becoming visible on the storefront.
         */
        product.setApproved(false);
        product.setActive(true);

        product = productRepository.save(product);

        saveOrUpdateInventory(
                product,
                request.getSizeStock()
        );

        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateAsSeller(
            Long sellerId,
            Long productId,
            ProductRequest request
    ) {
        validateProductRequest(request);

        Product product = getSellerProduct(
                sellerId,
                productId
        );

        Category category = getCategory(
                request.getCategorySlug()
        );

        String newSlug = resolveUpdatedSlug(
                product,
                request
        );

        product.setName(request.getName().trim());
        product.setSlug(newSlug);
        product.setDescription(trimToNull(request.getDescription()));
        product.setPrice(request.getPrice());
        product.setDiscountPercent(
                request.getDiscountPercent() == null
                        ? 0.0
                        : request.getDiscountPercent()
        );
        product.setCategory(category);
        product.setGender(parseGender(request.getGender()));
        product.setColor(trimToNull(request.getColor()));
        product.setMaterial(trimToNull(request.getMaterial()));
        product.setBrand(trimToNull(request.getBrand()));
        product.setThumbnail(trimToNull(request.getThumbnail()));

        product.setFeatures(safeList(request.getFeatures()));
        product.setSizes(safeList(request.getSizes()));
        product.setImages(safeList(request.getImages()));
        product.setTags(safeList(request.getTags()));

        product.setFeatured(request.isFeatured());
        product.setNewArrival(request.isNewArrival());
        product.setTrending(request.isTrending());

        /*
         * Every seller edit requires another admin review.
         */
        product.setApproved(false);
        product.recalculateFinalPrice();

        product = productRepository.save(product);

        if (request.getSizeStock() != null) {
            saveOrUpdateInventory(
                    product,
                    request.getSizeStock()
            );
        }

        return toResponse(product);
    }

    @Override
    @Transactional
    public void deleteAsSeller(
            Long sellerId,
            Long productId
    ) {
        Product product = getSellerProduct(
                sellerId,
                productId
        );

        product.setActive(false);

        productRepository.save(product);
    }

    @Override
    @Transactional
    public ProductResponse setApproval(
            Long productId,
            boolean approved
    ) {
        Product product = getProduct(productId);

        product.setApproved(approved);
        product = productRepository.save(product);

        return toResponse(product);
    }

    @Override
    public ProductResponse getById(Long id) {
        return toResponse(getProduct(id));
    }

    @Override
    public ProductResponse getBySlug(String slug) {
        if (!StringUtils.hasText(slug)) {
            throw new BadRequestException(
                    "Product slug is required"
            );
        }

        Product product = productRepository
                .findBySlug(slug.trim())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with slug: " + slug
                        )
                );

        return toResponse(product);
    }

    @Override
    public PagedResponse<ProductResponse> search(
            ProductFilterRequest filter,
            boolean adminView
    ) {
        if (filter == null) {
            throw new BadRequestException(
                    "Product filter cannot be null"
            );
        }

        Specification<Product> specification =
                Specification.where(null);

        if (!adminView) {
            specification = specification
                    .and(ProductSpecification.isActive())
                    .and(ProductSpecification.isApproved());
        }

        specification = specification
                .and(ProductSpecification.search(
                        filter.getSearch()
                ))
                .and(ProductSpecification.hasCategory(
                        filter.getCategory()
                ))
                .and(ProductSpecification.hasGender(
                        filter.getGender()
                ))
                .and(ProductSpecification.priceBetween(
                        filter.getMinPrice(),
                        filter.getMaxPrice()
                ))
                .and(ProductSpecification.minRating(
                        filter.getRating()
                ))
                .and(ProductSpecification.hasAnySize(
                        filter.getSizes()
                ))
                .and(ProductSpecification.hasAnyColor(
                        filter.getColors()
                ))
                .and(ProductSpecification.hasBrand(
                        filter.getBrand()
                ))
                .and(ProductSpecification.hasSeller(
                        filter.getSellerId()
                ));

        int pageNumber = Math.max(filter.getPage(), 0);
        int pageSize = Math.min(
                Math.max(filter.getSize(), 1),
                100
        );

        Pageable pageable = PageRequest.of(
                pageNumber,
                pageSize,
                resolveSort(filter.getSortBy())
        );

        Page<Product> productPage =
                productRepository.findAll(
                        specification,
                        pageable
                );

        return PagedResponse.from(
                productPage.map(this::toResponse)
        );
    }

    @Override
    public List<ProductResponse> getFeatured() {
        Specification<Product> specification =
                Specification
                        .where(ProductSpecification.isActive())
                        .and(ProductSpecification.isApproved())
                        .and(ProductSpecification.isFeatured());

        return productRepository
                .findAll(specification)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ProductResponse> getNewArrivals() {
        Specification<Product> specification =
                Specification
                        .where(ProductSpecification.isActive())
                        .and(ProductSpecification.isApproved())
                        .and(ProductSpecification.isNewArrival());

        Sort sort = Sort.by(
                Sort.Direction.DESC,
                "createdAt"
        );

        return productRepository
                .findAll(specification, sort)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ProductResponse> getTrending() {
        Specification<Product> specification =
                Specification
                        .where(ProductSpecification.isActive())
                        .and(ProductSpecification.isApproved())
                        .and(ProductSpecification.isTrending());

        return productRepository
                .findAll(specification)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ProductResponse> getByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        Specification<Product> specification =
                Specification
                        .where(ProductSpecification.isActive())
                        .and(ProductSpecification.isApproved())
                        .and((root, query, criteriaBuilder) ->
                                root.get("id").in(ids)
                        );

        return productRepository
                .findAll(specification)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Product buildProduct(
            ProductRequest request,
            Category category,
            String slug
    ) {
        Product product = Product.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(trimToNull(request.getDescription()))
                .price(request.getPrice())
                .discountPercent(
                        request.getDiscountPercent() == null
                                ? 0.0
                                : request.getDiscountPercent()
                )
                .category(category)
                .gender(parseGender(request.getGender()))
                .color(trimToNull(request.getColor()))
                .material(trimToNull(request.getMaterial()))
                .brand(trimToNull(request.getBrand()))
                .thumbnail(trimToNull(request.getThumbnail()))
                .features(safeList(request.getFeatures()))
                .sizes(safeList(request.getSizes()))
                .images(safeList(request.getImages()))
                .tags(safeList(request.getTags()))
                .isFeatured(request.isFeatured())
                .isNewArrival(request.isNewArrival())
                .isTrending(request.isTrending())
                .active(true)
                .build();

        product.recalculateFinalPrice();

        return product;
    }

    private Product getProduct(Long productId) {
        if (productId == null) {
            throw new BadRequestException(
                    "Product id is required"
            );
        }

        return productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + productId
                        )
                );
    }

    private Product getSellerProduct(
            Long sellerId,
            Long productId
    ) {
        if (sellerId == null) {
            throw new BadRequestException(
                    "Seller id is required"
            );
        }

        Product product = getProduct(productId);

        if (product.getSellerId() == null
                || !product.getSellerId().equals(sellerId)) {

            throw new ResourceNotFoundException(
                    "Product not found for this seller"
            );
        }

        return product;
    }

    private Category getCategory(String categorySlug) {
        if (!StringUtils.hasText(categorySlug)) {
            throw new BadRequestException(
                    "Category slug is required"
            );
        }

        return categoryRepository
                .findBySlug(categorySlug.trim())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Category not found with slug: "
                                        + categorySlug
                        )
                );
    }

    private String generateUniqueSlug(
            String requestedSlug,
            String productName
    ) {
        String slugSource = StringUtils.hasText(requestedSlug)
                ? requestedSlug
                : productName;

        String baseSlug = SlugUtil.toSlug(slugSource);

        if (!StringUtils.hasText(baseSlug)) {
            throw new BadRequestException(
                    "Unable to generate product slug"
            );
        }

        String uniqueSlug = baseSlug;
        int counter = 1;

        while (productRepository.existsBySlug(uniqueSlug)) {
            uniqueSlug = baseSlug + "-" + counter;
            counter++;
        }

        return uniqueSlug;
    }

    private String resolveUpdatedSlug(
            Product product,
            ProductRequest request
    ) {
        String slugSource = StringUtils.hasText(request.getSlug())
                ? request.getSlug()
                : request.getName();

        String newSlug = SlugUtil.toSlug(slugSource);

        if (!StringUtils.hasText(newSlug)) {
            throw new BadRequestException(
                    "Unable to generate product slug"
            );
        }

        if (!newSlug.equals(product.getSlug())
                && productRepository.existsBySlug(newSlug)) {

            throw new DuplicateResourceException(
                    "A product with slug '"
                            + newSlug
                            + "' already exists"
            );
        }

        return newSlug;
    }

    private Gender parseGender(String gender) {
        if (!StringUtils.hasText(gender)) {
            throw new BadRequestException(
                    "Gender is required"
            );
        }

        try {
            return Gender.valueOf(
                    gender.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                    "Invalid gender value: " + gender
            );
        }
    }

    private void validateProductRequest(ProductRequest request) {
        if (request == null) {
            throw new BadRequestException(
                    "Product request cannot be null"
            );
        }

        if (!StringUtils.hasText(request.getName())) {
            throw new BadRequestException(
                    "Product name is required"
            );
        }

        if (request.getPrice() == null) {
            throw new BadRequestException(
                    "Product price is required"
            );
        }

        if (request.getPrice() < 0) {
            throw new BadRequestException(
                    "Product price cannot be negative"
            );
        }

        Double discountPercent =
                request.getDiscountPercent();

        if (discountPercent != null
                && (discountPercent < 0
                || discountPercent > 100)) {

            throw new BadRequestException(
                    "Discount percent must be between 0 and 100"
            );
        }

        if (!StringUtils.hasText(
                request.getCategorySlug()
        )) {
            throw new BadRequestException(
                    "Category slug is required"
            );
        }

        parseGender(request.getGender());

        validateStock(request.getSizeStock());
    }

    private void validateStock(
            Map<String, Integer> sizeStock
    ) {
        if (sizeStock == null) {
            return;
        }

        for (Map.Entry<String, Integer> entry
                : sizeStock.entrySet()) {

            if (!StringUtils.hasText(entry.getKey())) {
                throw new BadRequestException(
                        "Inventory size cannot be blank"
                );
            }

            if (entry.getValue() == null
                    || entry.getValue() < 0) {

                throw new BadRequestException(
                        "Stock cannot be negative for size: "
                                + entry.getKey()
                );
            }
        }
    }

    private void saveOrUpdateInventory(
            Product product,
            Map<String, Integer> requestedStock
    ) {
        if (requestedStock == null) {
            return;
        }

        Inventory inventory = inventoryRepository
                .findByProductId(product.getId())
                .orElseGet(() ->
                        Inventory.builder()
                                .product(product)
                                .sizeStock(new HashMap<>())
                                .reserved(0)
                                .build()
                );

        inventory.setSizeStock(
                new HashMap<>(requestedStock)
        );

        if (inventory.getReserved() == null) {
            inventory.setReserved(0);
        }

        inventoryRepository.save(inventory);
    }

    private Sort resolveSort(String sortBy) {
        if (!StringUtils.hasText(sortBy)) {
            return Sort.by(
                    Sort.Direction.DESC,
                    "createdAt"
            );
        }

        return switch (
                sortBy.trim().toLowerCase(Locale.ROOT)
        ) {
            case "price_asc" ->
                    Sort.by(
                            Sort.Direction.ASC,
                            "finalPrice"
                    );

            case "price_desc" ->
                    Sort.by(
                            Sort.Direction.DESC,
                            "finalPrice"
                    );

            case "rating" ->
                    Sort.by(
                            Sort.Direction.DESC,
                            "rating"
                    );

            case "discount" ->
                    Sort.by(
                            Sort.Direction.DESC,
                            "discountPercent"
                    );

            case "newest" ->
                    Sort.by(
                            Sort.Direction.DESC,
                            "createdAt"
                    );

            default ->
                    Sort.by(
                            Sort.Direction.DESC,
                            "createdAt"
                    );
        };
    }

    private ProductResponse toResponse(Product product) {
        Inventory inventory = inventoryRepository
                .findByProductId(product.getId())
                .orElse(null);

        Integer availableStock =
                inventory == null
                        ? null
                        : inventory.getAvailable();

        Map<String, Integer> stockBySize =
                inventory == null
                        || inventory.getSizeStock() == null
                        ? Map.of()
                        : new HashMap<>(
                                inventory.getSizeStock()
                        );

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPercent(product.getDiscountPercent())
                .finalPrice(product.getFinalPrice())

                .categoryName(
                        product.getCategory() == null
                                ? null
                                : product.getCategory().getName()
                )

                .categorySlug(
                        product.getCategory() == null
                                ? null
                                : product.getCategory().getSlug()
                )

                .gender(
                        product.getGender() == null
                                ? null
                                : product.getGender().name()
                )

                .color(product.getColor())
                .material(product.getMaterial())
                .brand(product.getBrand())
                .thumbnail(product.getThumbnail())

                .features(safeList(product.getFeatures()))
                .sizes(safeList(product.getSizes()))
                .images(safeList(product.getImages()))
                .tags(safeList(product.getTags()))

                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .isFeatured(product.isFeatured())
                .isNewArrival(product.isNewArrival())
                .isTrending(product.isTrending())
                .active(product.isActive())
                .sellerId(product.getSellerId())
                .sellerName(product.getSellerName())
                .approved(product.isApproved())
                .availableStock(availableStock)
                .stockBySize(stockBySize)
                .createdAt(product.getCreatedAt())
                .build();
    }

    private List<String> safeList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }

        return values.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .collect(
                        java.util.stream.Collectors.toCollection(
                                ArrayList::new
                        )
                );
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value)
                ? value.trim()
                : null;
    }
}

