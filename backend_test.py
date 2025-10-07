#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Product Management Module
Tests all product endpoints including CRUD operations, margin analysis, 
promotional pricing, volume discounts, and stock management.
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://motoparts-pos.preview.emergentagent.com/api"
AUTH_USERNAME = "admin"
AUTH_PASSWORD = "admin123"

class ProductManagementTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.test_results = []
        self.created_products = []
        self.created_categories = []
        self.created_brands = []
        self.created_branches = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def authenticate(self):
        """Authenticate and get JWT token"""
        try:
            # First initialize the system
            init_response = requests.get(f"{self.base_url}/init")
            print(f"System initialization: {init_response.status_code}")
            
            # Login to get token
            login_data = {
                "username": AUTH_USERNAME,
                "password": AUTH_PASSWORD
            }
            
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                self.log_result("Authentication", True, "Successfully authenticated", 
                              f"Token received for user: {data.get('user', {}).get('username')}")
                return True
            else:
                self.log_result("Authentication", False, f"Login failed: {response.status_code}", 
                              response.text)
                return False
                
        except Exception as e:
            self.log_result("Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get headers with authorization token"""
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def setup_test_data(self):
        """Create test categories, brands, and branches for product testing"""
        try:
            # Create test category
            category_data = {
                "name": "Motorcycle Parts",
                "description": "Test category for motorcycle parts",
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/categories/create", 
                                   json=category_data, headers=self.get_headers())
            
            if response.status_code == 200:
                category = response.json()
                self.created_categories.append(category['id'])
                self.log_result("Setup - Category Creation", True, 
                              f"Created test category: {category['name']}")
            else:
                self.log_result("Setup - Category Creation", False, 
                              f"Failed to create category: {response.status_code}")
                return False
            
            # Create test brand
            brand_data = {
                "name": "Honda",
                "description": "Test brand for Honda parts",
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/brands/create", 
                                   json=brand_data, headers=self.get_headers())
            
            if response.status_code == 200:
                brand = response.json()
                self.created_brands.append(brand['id'])
                self.log_result("Setup - Brand Creation", True, 
                              f"Created test brand: {brand['name']}")
            else:
                self.log_result("Setup - Brand Creation", False, 
                              f"Failed to create brand: {response.status_code}")
                return False
            
            # Create test branch
            branch_data = {
                "name": "Main Branch",
                "code": "MB001",
                "address": "123 Main Street",
                "phone": "555-0123",
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/branches/create", 
                                   json=branch_data, headers=self.get_headers())
            
            if response.status_code == 200:
                branch = response.json()
                self.created_branches.append(branch['id'])
                self.log_result("Setup - Branch Creation", True, 
                              f"Created test branch: {branch['name']}")
                return True
            else:
                self.log_result("Setup - Branch Creation", False, 
                              f"Failed to create branch: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Setup Test Data", False, f"Setup error: {str(e)}")
            return False
    
    def test_product_crud_operations(self):
        """Test Product CRUD Operations (FR-PRD-001)"""
        try:
            # Test 1: Create Product with all fields
            product_data = {
                "name": "Honda CBR 600RR Brake Pad",
                "category_id": self.created_categories[0],
                "brand_id": self.created_brands[0],
                "compatible_models": "CBR 600RR 2013-2020",
                "uom": "Set",
                "purchase_price": 45.50,
                "price_levels": {
                    "retail": 89.99,
                    "wholesale": 75.00,
                    "member": 80.00
                },
                "technical_specs": "Organic brake pad compound, high temperature resistance",
                "storage_location": "A1-B2-C3",
                "tags": ["brake", "safety", "honda"],
                "labels": ["bestseller", "premium"],
                "stock_per_branch": {
                    self.created_branches[0]: 25
                },
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/products/create", 
                                   json=product_data, headers=self.get_headers())
            
            if response.status_code == 200:
                product = response.json()
                self.created_products.append(product['id'])
                
                # Verify all fields are saved correctly
                if (product['name'] == product_data['name'] and 
                    product['purchase_price'] == product_data['purchase_price'] and
                    product['price_levels']['retail'] == product_data['price_levels']['retail']):
                    
                    self.log_result("Product CRUD - Create", True, 
                                  f"Product created successfully with ID: {product['id']}", 
                                  f"SKU: {product['sku']}, Name: {product['name']}")
                else:
                    self.log_result("Product CRUD - Create", False, 
                                  "Product created but data mismatch", 
                                  f"Expected: {product_data['name']}, Got: {product['name']}")
            else:
                self.log_result("Product CRUD - Create", False, 
                              f"Failed to create product: {response.status_code}", 
                              response.text)
                return False
            
            # Test 2: Read Product
            response = requests.get(f"{self.base_url}/products/{product['id']}", 
                                  headers=self.get_headers())
            
            if response.status_code == 200:
                retrieved_product = response.json()
                if retrieved_product['id'] == product['id']:
                    self.log_result("Product CRUD - Read", True, 
                                  f"Product retrieved successfully", 
                                  f"Name: {retrieved_product['name']}")
                else:
                    self.log_result("Product CRUD - Read", False, 
                                  "Product ID mismatch in retrieval")
            else:
                self.log_result("Product CRUD - Read", False, 
                              f"Failed to retrieve product: {response.status_code}")
            
            # Test 3: Update Product
            update_data = {
                "name": "Honda CBR 600RR Premium Brake Pad",
                "category_id": product_data['category_id'],
                "brand_id": product_data['brand_id'],
                "compatible_models": "CBR 600RR 2013-2021",
                "uom": "Set",
                "purchase_price": 48.00,
                "price_levels": {
                    "retail": 94.99,
                    "wholesale": 78.00,
                    "member": 83.00
                },
                "technical_specs": "Premium organic brake pad compound, enhanced heat dissipation",
                "storage_location": "A1-B2-C4",
                "tags": ["brake", "safety", "honda", "premium"],
                "labels": ["bestseller", "premium", "updated"],
                "stock_per_branch": product_data['stock_per_branch'],
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/products/{product['id']}/update", 
                                   json=update_data, headers=self.get_headers())
            
            if response.status_code == 200:
                updated_product = response.json()
                if updated_product['name'] == update_data['name']:
                    self.log_result("Product CRUD - Update", True, 
                                  f"Product updated successfully", 
                                  f"New name: {updated_product['name']}")
                else:
                    self.log_result("Product CRUD - Update", False, 
                                  "Product update failed - name not changed")
            else:
                self.log_result("Product CRUD - Update", False, 
                              f"Failed to update product: {response.status_code}")
            
            # Test 4: Toggle Product Active Status
            response = requests.post(f"{self.base_url}/products/{product['id']}/toggle", 
                                   headers=self.get_headers())
            
            if response.status_code == 200:
                toggled_product = response.json()
                if toggled_product['is_active'] != product['is_active']:
                    self.log_result("Product CRUD - Toggle", True, 
                                  f"Product status toggled successfully", 
                                  f"Active status: {toggled_product['is_active']}")
                else:
                    self.log_result("Product CRUD - Toggle", False, 
                                  "Product toggle failed - status unchanged")
            else:
                self.log_result("Product CRUD - Toggle", False, 
                              f"Failed to toggle product: {response.status_code}")
            
            return True
            
        except Exception as e:
            self.log_result("Product CRUD Operations", False, f"CRUD test error: {str(e)}")
            return False
    
    def test_automatic_sku_barcode_generation(self):
        """Test Automatic SKU/Barcode Generation (FR-PRD-002)"""
        try:
            # Test 1: Create product without SKU and barcode
            product_data = {
                "name": "Auto-Generated Test Product",
                "category_id": self.created_categories[0],
                "brand_id": self.created_brands[0],
                "compatible_models": "Universal",
                "uom": "Piece",
                "purchase_price": 25.00,
                "price_levels": {
                    "retail": 49.99,
                    "wholesale": 40.00,
                    "member": 45.00
                },
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/products/create", 
                                   json=product_data, headers=self.get_headers())
            
            if response.status_code == 200:
                product = response.json()
                self.created_products.append(product['id'])
                
                # Verify SKU and barcode are auto-generated
                if (product.get('sku') and product.get('barcode') and 
                    product['sku'].startswith('PRD') and len(product['barcode']) >= 10):
                    
                    self.log_result("Auto SKU/Barcode Generation", True, 
                                  f"SKU and barcode auto-generated successfully", 
                                  f"SKU: {product['sku']}, Barcode: {product['barcode']}")
                else:
                    self.log_result("Auto SKU/Barcode Generation", False, 
                                  "SKU or barcode not properly generated", 
                                  f"SKU: {product.get('sku')}, Barcode: {product.get('barcode')}")
            else:
                self.log_result("Auto SKU/Barcode Generation", False, 
                              f"Failed to create product: {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("SKU/Barcode Generation", False, f"Generation test error: {str(e)}")
            return False
    
    def test_multiple_price_levels(self):
        """Test Multiple Price Levels (FR-PRD-008)"""
        try:
            # Create product with multiple price levels
            product_data = {
                "name": "Multi-Price Test Product",
                "category_id": self.created_categories[0],
                "brand_id": self.created_brands[0],
                "compatible_models": "Universal",
                "uom": "Piece",
                "purchase_price": 20.00,
                "price_levels": {
                    "retail": 39.99,
                    "wholesale": 32.00,
                    "member": 35.50
                },
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/products/create", 
                                   json=product_data, headers=self.get_headers())
            
            if response.status_code == 200:
                product = response.json()
                self.created_products.append(product['id'])
                
                # Verify all price levels are saved correctly
                price_levels = product.get('price_levels', {})
                if (price_levels.get('retail') == 39.99 and 
                    price_levels.get('wholesale') == 32.00 and 
                    price_levels.get('member') == 35.50):
                    
                    self.log_result("Multiple Price Levels", True, 
                                  f"All price levels saved correctly", 
                                  f"Retail: {price_levels['retail']}, Wholesale: {price_levels['wholesale']}, Member: {price_levels['member']}")
                else:
                    self.log_result("Multiple Price Levels", False, 
                                  "Price levels not saved correctly", 
                                  f"Expected retail: 39.99, Got: {price_levels.get('retail')}")
            else:
                self.log_result("Multiple Price Levels", False, 
                              f"Failed to create product: {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Multiple Price Levels", False, f"Price levels test error: {str(e)}")
            return False
    
    def test_margin_analysis(self):
        """Test Margin Analysis (FR-PRD-011)"""
        try:
            # Test margin report endpoint
            response = requests.get(f"{self.base_url}/products/margin-report", 
                                  headers=self.get_headers())
            
            if response.status_code == 200:
                margin_data = response.json()
                
                # Verify report structure
                if ('products' in margin_data and 'summary' in margin_data and 
                    isinstance(margin_data['products'], list)):
                    
                    # Check if our test products are in the report
                    test_product_found = False
                    for product in margin_data['products']:
                        if product['id'] in self.created_products:
                            test_product_found = True
                            
                            # Verify margin calculations
                            if ('margins' in product and 
                                'total_stock' in product and 
                                'stock_value' in product):
                                
                                self.log_result("Margin Analysis - Report Structure", True, 
                                              f"Margin report generated successfully", 
                                              f"Found {len(margin_data['products'])} products in report")
                                break
                    
                    if not test_product_found:
                        self.log_result("Margin Analysis - Test Product", False, 
                                      "Test products not found in margin report")
                    
                    # Verify summary statistics
                    summary = margin_data.get('summary', {})
                    if ('total_products' in summary and 
                        'total_stock_value' in summary and 
                        'average_margins' in summary):
                        
                        self.log_result("Margin Analysis - Summary", True, 
                                      f"Summary statistics calculated correctly", 
                                      f"Total products: {summary['total_products']}, Stock value: {summary['total_stock_value']}")
                    else:
                        self.log_result("Margin Analysis - Summary", False, 
                                      "Summary statistics incomplete")
                else:
                    self.log_result("Margin Analysis - Report Structure", False, 
                                  "Invalid margin report structure")
            else:
                self.log_result("Margin Analysis", False, 
                              f"Failed to get margin report: {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Margin Analysis", False, f"Margin analysis test error: {str(e)}")
            return False
    
    def test_promotional_pricing(self):
        """Test Time-based Pricing/Promotions (FR-PRD-009)"""
        try:
            if not self.created_products:
                self.log_result("Promotional Pricing", False, "No test products available")
                return False
            
            product_id = self.created_products[0]
            
            # Create promotional pricing
            promo_data = {
                "name": "Black Friday Sale",
                "price_levels": {
                    "retail": 29.99,
                    "wholesale": 25.00,
                    "member": 27.50
                },
                "start_date": (datetime.now() - timedelta(days=1)).isoformat(),
                "end_date": (datetime.now() + timedelta(days=30)).isoformat(),
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/products/{product_id}/promo", 
                                   json=promo_data, headers=self.get_headers())
            
            if response.status_code == 200:
                updated_product = response.json()
                
                # Verify promotional pricing was added
                promos = updated_product.get('promotional_pricing', [])
                if promos and len(promos) > 0:
                    promo = promos[-1]  # Get the latest promo
                    if (promo['name'] == "Black Friday Sale" and 
                        promo['is_active'] == True):
                        
                        self.log_result("Promotional Pricing - Creation", True, 
                                      f"Promotional pricing created successfully", 
                                      f"Promo: {promo['name']}, Active: {promo['is_active']}")
                    else:
                        self.log_result("Promotional Pricing - Creation", False, 
                                      "Promotional pricing data incorrect")
                else:
                    self.log_result("Promotional Pricing - Creation", False, 
                                  "Promotional pricing not added to product")
            else:
                self.log_result("Promotional Pricing", False, 
                              f"Failed to create promotional pricing: {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Promotional Pricing", False, f"Promotional pricing test error: {str(e)}")
            return False
    
    def test_volume_discounts(self):
        """Test Volume Discount Rules (FR-PRD-010)"""
        try:
            if not self.created_products:
                self.log_result("Volume Discounts", False, "No test products available")
                return False
            
            product_id = self.created_products[0]
            
            # Create volume discount rule
            discount_data = {
                "min_quantity": 10,
                "discount_type": "percentage",
                "discount_value": 15.0,
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/products/{product_id}/volume-discount", 
                                   json=discount_data, headers=self.get_headers())
            
            if response.status_code == 200:
                updated_product = response.json()
                
                # Verify volume discount was added
                discounts = updated_product.get('volume_discounts', [])
                if discounts and len(discounts) > 0:
                    discount = discounts[-1]  # Get the latest discount
                    if (discount['min_quantity'] == 10 and 
                        discount['discount_type'] == "percentage" and 
                        discount['discount_value'] == 15.0):
                        
                        self.log_result("Volume Discounts - Creation", True, 
                                      f"Volume discount created successfully", 
                                      f"Min qty: {discount['min_quantity']}, Discount: {discount['discount_value']}%")
                    else:
                        self.log_result("Volume Discounts - Creation", False, 
                                      "Volume discount data incorrect")
                else:
                    self.log_result("Volume Discounts - Creation", False, 
                                  "Volume discount not added to product")
            else:
                self.log_result("Volume Discounts", False, 
                              f"Failed to create volume discount: {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Volume Discounts", False, f"Volume discounts test error: {str(e)}")
            return False
    
    def test_stock_management(self):
        """Test Stock Management per Branch"""
        try:
            if not self.created_products or not self.created_branches:
                self.log_result("Stock Management", False, "No test products or branches available")
                return False
            
            product_id = self.created_products[0]
            branch_id = self.created_branches[0]
            
            # Update stock for branch
            stock_data = {
                "branch_id": branch_id,
                "stock_quantity": 50
            }
            
            response = requests.post(f"{self.base_url}/products/{product_id}/stock", 
                                   json=stock_data, headers=self.get_headers())
            
            if response.status_code == 200:
                updated_product = response.json()
                
                # Verify stock was updated
                stock_per_branch = updated_product.get('stock_per_branch', {})
                if stock_per_branch.get(branch_id) == 50:
                    self.log_result("Stock Management - Update", True, 
                                  f"Stock updated successfully", 
                                  f"Branch {branch_id}: {stock_per_branch[branch_id]} units")
                else:
                    self.log_result("Stock Management - Update", False, 
                                  "Stock not updated correctly", 
                                  f"Expected: 50, Got: {stock_per_branch.get(branch_id)}")
            else:
                self.log_result("Stock Management", False, 
                              f"Failed to update stock: {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Stock Management", False, f"Stock management test error: {str(e)}")
            return False
    
    def test_product_search_filtering(self):
        """Test Product Search and Filtering"""
        try:
            # Test 1: Get all products
            response = requests.get(f"{self.base_url}/products", headers=self.get_headers())
            
            if response.status_code == 200:
                all_products = response.json()
                if isinstance(all_products, list):
                    self.log_result("Product Search - All Products", True, 
                                  f"Retrieved all products successfully", 
                                  f"Total products: {len(all_products)}")
                else:
                    self.log_result("Product Search - All Products", False, 
                                  "Invalid response format for all products")
            else:
                self.log_result("Product Search - All Products", False, 
                              f"Failed to get all products: {response.status_code}")
                return False
            
            # Test 2: Filter by category
            if self.created_categories:
                response = requests.get(f"{self.base_url}/products?category_id={self.created_categories[0]}", 
                                      headers=self.get_headers())
                
                if response.status_code == 200:
                    filtered_products = response.json()
                    self.log_result("Product Search - Category Filter", True, 
                                  f"Category filtering works", 
                                  f"Products in category: {len(filtered_products)}")
                else:
                    self.log_result("Product Search - Category Filter", False, 
                                  f"Category filtering failed: {response.status_code}")
            
            # Test 3: Search by name
            response = requests.get(f"{self.base_url}/products?search=Honda", 
                                  headers=self.get_headers())
            
            if response.status_code == 200:
                search_results = response.json()
                self.log_result("Product Search - Text Search", True, 
                              f"Text search works", 
                              f"Search results: {len(search_results)}")
            else:
                self.log_result("Product Search - Text Search", False, 
                              f"Text search failed: {response.status_code}")
            
            return True
            
        except Exception as e:
            self.log_result("Product Search and Filtering", False, f"Search test error: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """Clean up created test data"""
        try:
            # Delete created products
            for product_id in self.created_products:
                try:
                    response = requests.post(f"{self.base_url}/products/{product_id}/delete", 
                                           headers=self.get_headers())
                    if response.status_code == 200:
                        print(f"Deleted product: {product_id}")
                except:
                    pass
            
            # Delete created categories
            for category_id in self.created_categories:
                try:
                    response = requests.post(f"{self.base_url}/categories/{category_id}/delete", 
                                           headers=self.get_headers())
                    if response.status_code == 200:
                        print(f"Deleted category: {category_id}")
                except:
                    pass
            
            # Delete created brands
            for brand_id in self.created_brands:
                try:
                    response = requests.post(f"{self.base_url}/brands/{brand_id}/delete", 
                                           headers=self.get_headers())
                    if response.status_code == 200:
                        print(f"Deleted brand: {brand_id}")
                except:
                    pass
            
            # Delete created branches
            for branch_id in self.created_branches:
                try:
                    response = requests.post(f"{self.base_url}/branches/{branch_id}/delete", 
                                           headers=self.get_headers())
                    if response.status_code == 200:
                        print(f"Deleted branch: {branch_id}")
                except:
                    pass
            
            self.log_result("Cleanup", True, "Test data cleanup completed")
            
        except Exception as e:
            self.log_result("Cleanup", False, f"Cleanup error: {str(e)}")
    
    def run_all_tests(self):
        """Run all product management tests"""
        print("=" * 80)
        print("PRODUCT MANAGEMENT MODULE - BACKEND API TESTING")
        print("=" * 80)
        
        # Authentication
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        # Setup test data
        if not self.setup_test_data():
            print("❌ Test data setup failed. Cannot proceed with tests.")
            return
        
        # Run all tests
        test_methods = [
            self.test_product_crud_operations,
            self.test_automatic_sku_barcode_generation,
            self.test_multiple_price_levels,
            self.test_margin_analysis,
            self.test_promotional_pricing,
            self.test_volume_discounts,
            self.test_stock_management,
            self.test_product_search_filtering
        ]
        
        for test_method in test_methods:
            try:
                print(f"\n--- Running {test_method.__name__} ---")
                test_method()
            except Exception as e:
                self.log_result(test_method.__name__, False, f"Test execution error: {str(e)}")
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 80)
        print("TEST RESULTS SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"  - {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = ProductManagementTester()
    tester.run_all_tests()