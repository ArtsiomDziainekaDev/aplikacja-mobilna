package org.example.security.controller;

import lombok.RequiredArgsConstructor;
import org.example.security.jwt.JwtUtils;
import org.example.security.dto.JwtResponse;
import org.example.security.dto.LoginRequest;
import org.example.security.dto.SignupRequest;
import org.example.security.UserDetailsImpl;
import org.example.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class SecurityController {
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getUser().getId(),
                userDetails.getEmail(),
                userDetails.getAuthorities().stream()
                        .map(item -> item.getAuthority())
                        .toArray(String[]::new)));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        // Walidacja pól
        if (signUpRequest.getUsername() == null || signUpRequest.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Błąd: Nazwa użytkownika jest wymagana!");
        }
        
        if (signUpRequest.getEmail() == null || signUpRequest.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Błąd: Email jest wymagany!");
        }
        
        if (signUpRequest.getPassword() == null || signUpRequest.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body("Błąd: Hasło musi mieć co najmniej 6 znaków!");
        }
        
        if (userService.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Błąd: Email jest już używany!");
        }

        // Tworzy użytkownika
        userService.createUser(signUpRequest.getUsername(), signUpRequest.getEmail(), signUpRequest.getPassword());
        
        // Zwraca komunikat o sukcesie
        return ResponseEntity.ok().body("Konto zostało pomyślnie utworzone! Możesz się teraz zalogować.");
    }

    @GetMapping("/check")
    public ResponseEntity<JwtResponse> checkToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            return ResponseEntity.ok(new JwtResponse(
                "",
                userDetails.getUser().getId(),
                userDetails.getEmail(),
                userDetails.getAuthorities().stream()
                        .map(item -> item.getAuthority())
                        .toArray(String[]::new)
            ));
        }
        return ResponseEntity.status(401).body(new JwtResponse("", null, "", new String[0]));
    }
} 