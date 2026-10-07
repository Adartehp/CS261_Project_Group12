package com.example.demo.controller;
import com.example.demo.model.Product;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicLong;
@RestController
@RequestMapping("/api/products")
public class ProductController {
private final List<Product> products = new ArrayList<>();
private final AtomicLong idCounter = new AtomicLong();
@GetMapping
public List<Product> getProducts() {
return products;
}
@PostMapping
public Product addProduct(@RequestBody Product product) {
product.setId(idCounter.incrementAndGet());
products.add(product);
return product;
}
}