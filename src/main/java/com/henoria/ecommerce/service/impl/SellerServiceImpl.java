package com.henoria.ecommerce.service.impl;

import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.seller.SellerRegisterRequest;
import com.henoria.ecommerce.dto.seller.SellerResponse;
import com.henoria.ecommerce.entity.Seller;
import com.henoria.ecommerce.entity.User;
import com.henoria.ecommerce.entity.enums.Role;
import com.henoria.ecommerce.entity.enums.SellerStatus;
import com.henoria.ecommerce.exception.BadRequestException;
import com.henoria.ecommerce.exception.ResourceNotFoundException;
import com.henoria.ecommerce.repository.SellerRepository;
import com.henoria.ecommerce.repository.UserRepository;
import com.henoria.ecommerce.service.EmailService;
import com.henoria.ecommerce.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SellerServiceImpl implements SellerService {

    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    public SellerResponse registerAsSeller(Long userId, SellerRegisterRequest request) {
        if (sellerRepository.existsByUserId(userId)) {
            throw new BadRequestException("You have already applied to become a seller");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Seller seller = Seller.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .gstNumber(request.getGstNumber())
                .phone(request.getPhone())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .status(SellerStatus.PENDING)
                .build();

        seller = sellerRepository.save(seller);
        return toResponse(seller);
    }

    @Override
    public SellerResponse getMyProfile(Long userId) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("You have not applied to become a seller yet"));
        return toResponse(seller);
    }

    @Override
    public PagedResponse<SellerResponse> getAll(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Seller> sellers;
        if (status != null && !status.isBlank()) {
            sellers = sellerRepository.findByStatus(SellerStatus.valueOf(status.toUpperCase()), pageable);
        } else {
            sellers = sellerRepository.findAll(pageable);
        }
        return PagedResponse.from(sellers.map(this::toResponse));
    }

    @Override
    public SellerResponse approve(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller application not found"));
        seller.setStatus(SellerStatus.APPROVED);
        seller.setRejectionReason(null);
        sellerRepository.save(seller);

        User user = seller.getUser();
        user.setRole(Role.SELLER);
        userRepository.save(user);

        emailService.sendWelcomeEmail(user.getEmail(),
                user.getName() + " (Seller account approved - please log in again to access your seller dashboard)");

        return toResponse(seller);
    }

    @Override
    public SellerResponse reject(Long sellerId, String reason) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller application not found"));
        seller.setStatus(SellerStatus.REJECTED);
        seller.setRejectionReason(reason);
        sellerRepository.save(seller);
        return toResponse(seller);
    }

    private SellerResponse toResponse(Seller seller) {
        return SellerResponse.builder()
                .id(seller.getId())
                .userId(seller.getUser().getId())
                .userName(seller.getUser().getName())
                .userEmail(seller.getUser().getEmail())
                .businessName(seller.getBusinessName())
                .gstNumber(seller.getGstNumber())
                .phone(seller.getPhone())
                .address(seller.getAddress())
                .city(seller.getCity())
                .state(seller.getState())
                .pincode(seller.getPincode())
                .status(seller.getStatus().name())
                .rejectionReason(seller.getRejectionReason())
                .commissionPercent(seller.getCommissionPercent())
                .createdAt(seller.getCreatedAt())
                .build();
    }
}
