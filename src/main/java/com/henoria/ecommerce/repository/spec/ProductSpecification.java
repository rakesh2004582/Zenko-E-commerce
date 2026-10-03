package com.henoria.ecommerce.repository.spec;

import com.henoria.ecommerce.entity.Product;
import com.henoria.ecommerce.entity.enums.Gender;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.List;

public class ProductSpecification {

    public static Specification<Product> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    public static Specification<Product> isApproved() {
        return (root, query, cb) -> cb.isTrue(root.get("approved"));
    }

    public static Specification<Product> hasSeller(Long sellerId) {
        return (root, query, cb) -> {
            if (sellerId == null) return cb.conjunction();
            return cb.equal(root.get("sellerId"), sellerId);
        };
    }

    public static Specification<Product> hasCategory(String categorySlug) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(categorySlug)) return cb.conjunction();
            Join<Object, Object> category = root.join("category", JoinType.LEFT);
            return cb.equal(category.get("slug"), categorySlug);
        };
    }

    public static Specification<Product> hasGender(String gender) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(gender)) return cb.conjunction();
            try {
                return cb.equal(root.get("gender"), Gender.valueOf(gender.toUpperCase()));
            } catch (IllegalArgumentException ex) {
                return cb.conjunction();
            }
        };
    }

    public static Specification<Product> priceBetween(Double min, Double max) {
        return (root, query, cb) -> {
            if (min == null && max == null) return cb.conjunction();
            if (min != null && max != null) return cb.between(root.get("finalPrice"), min, max);
            if (min != null) return cb.greaterThanOrEqualTo(root.get("finalPrice"), min);
            return cb.lessThanOrEqualTo(root.get("finalPrice"), max);
        };
    }

    public static Specification<Product> minRating(Double rating) {
        return (root, query, cb) -> {
            if (rating == null) return cb.conjunction();
            return cb.greaterThanOrEqualTo(root.get("rating"), rating);
        };
    }

    public static Specification<Product> hasAnySize(List<String> sizes) {
        return (root, query, cb) -> {
            if (sizes == null || sizes.isEmpty()) return cb.conjunction();
            query.distinct(true);
            Join<Object, Object> sizeJoin = root.join("sizes", JoinType.LEFT);
            return sizeJoin.in(sizes);
        };
    }

    public static Specification<Product> hasAnyColor(List<String> colors) {
        return (root, query, cb) -> {
            if (colors == null || colors.isEmpty()) return cb.conjunction();
            return cb.lower(root.get("color")).in(colors.stream().map(String::toLowerCase).toList());
        };
    }

    public static Specification<Product> hasBrand(String brand) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(brand)) return cb.conjunction();
            return cb.equal(cb.lower(root.get("brand")), brand.toLowerCase());
        };
    }

    /** Full text-ish search across name, description, brand and tags */
    public static Specification<Product> search(String term) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(term)) return cb.conjunction();
            query.distinct(true);
            String like = "%" + term.toLowerCase() + "%";
            Join<Object, Object> tags = root.join("tags", JoinType.LEFT);
            Predicate nameMatch = cb.like(cb.lower(root.get("name")), like);
            Predicate descMatch = cb.like(cb.lower(root.get("description")), like);
            Predicate brandMatch = cb.like(cb.lower(root.get("brand")), like);
            Predicate tagMatch = cb.like(
                    cb.lower(tags.as(String.class)),
                    like
            );
            return cb.or(nameMatch, descMatch, brandMatch, tagMatch);
        };
    }

    public static Specification<Product> isFeatured() {
        return (root, query, cb) -> cb.isTrue(root.get("isFeatured"));
    }

    public static Specification<Product> isNewArrival() {
        return (root, query, cb) -> cb.isTrue(root.get("isNewArrival"));
    }

    public static Specification<Product> isTrending() {
        return (root, query, cb) -> cb.isTrue(root.get("isTrending"));
    }
}
