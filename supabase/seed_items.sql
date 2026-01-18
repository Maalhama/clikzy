-- ============================================
-- CLIKZY - 50 Produits Populaires en France
-- ============================================

-- Supprimer les anciens items de test
DELETE FROM items WHERE is_active = true;

-- ============================================
-- SMARTPHONES (10 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('iPhone 15 Pro Max', 'Le smartphone ultime d''Apple avec puce A17 Pro, ecran 6.7" Super Retina XDR et camera 48MP', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=90&fit=crop', 1479.00, true),
('iPhone 15 Pro', 'Puissance et design premium avec titane, Action Button et USB-C', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=90&fit=crop', 1229.00, true),
('Samsung Galaxy S24 Ultra', 'Le flagship Samsung avec S Pen integre, camera 200MP et Galaxy AI', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=90&fit=crop', 1469.00, true),
('Samsung Galaxy Z Fold 5', 'Smartphone pliable nouvelle generation avec ecran 7.6" depliant', 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=90&fit=crop', 1899.00, true),
('Google Pixel 8 Pro', 'L''IA Google dans votre poche avec le meilleur appareil photo Android', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=90&fit=crop', 1099.00, true);

-- ============================================
-- GAMING (10 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('PlayStation 5', 'Console next-gen Sony avec SSD ultra-rapide et DualSense', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=90&fit=crop', 549.00, true),
('PlayStation 5 Digital', 'PS5 edition digitale sans lecteur de disque', 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&q=90&fit=crop', 449.00, true),
('Xbox Series X', 'La console Microsoft la plus puissante avec 12 teraflops', 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=90&fit=crop', 499.00, true),
('Nintendo Switch OLED', 'Console hybride Nintendo avec ecran OLED 7 pouces', 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=90&fit=crop', 349.00, true),
('Steam Deck OLED', 'PC gaming portable de Valve avec ecran OLED HDR', 'https://images.unsplash.com/photo-1640955014216-75201056c829?w=800&q=90&fit=crop', 569.00, true),
('Meta Quest 3', 'Casque VR autonome avec realite mixte', 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=90&fit=crop', 549.00, true),
('Manette PS5 DualSense Edge', 'Manette pro personnalisable pour PS5', 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=90&fit=crop', 239.00, true);

-- ============================================
-- ORDINATEURS & TABLETTES (10 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('MacBook Pro 16" M3 Max', 'Le laptop Apple le plus puissant avec puce M3 Max', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=90&fit=crop', 4499.00, true),
('MacBook Pro 14" M3 Pro', 'Performance pro dans un format compact', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=90&fit=crop', 2499.00, true),
('MacBook Air 15" M3', 'Le MacBook Air grand ecran ultrafin', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=90&fit=crop', 1599.00, true),
('iPad Pro 12.9" M2', 'La tablette pro ultime avec puce M2 et ecran Liquid Retina XDR', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=90&fit=crop', 1469.00, true),
('iPad Air M2', 'Puissance M2 dans le design Air', 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=90&fit=crop', 769.00, true),
('iMac 24" M3', 'L''ordinateur tout-en-un colore d''Apple', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=90&fit=crop', 1699.00, true),
('ASUS ROG Zephyrus G16', 'PC portable gaming haut de gamme avec RTX 4090', 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=90&fit=crop', 3299.00, true);

-- ============================================
-- AUDIO (8 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('AirPods Pro 2', 'Ecouteurs sans fil Apple avec reduction de bruit active et USB-C', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=90&fit=crop', 279.00, true),
('AirPods Max', 'Casque audio haut de gamme Apple avec audio spatial', 'https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=800&q=90&fit=crop', 579.00, true),
('Sony WH-1000XM5', 'Le meilleur casque a reduction de bruit du marche', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90&fit=crop', 379.00, true),
('Bose QuietComfort Ultra', 'Casque Bose avec audio immersif Bose Immersive', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=90&fit=crop', 449.00, true),
('Sonos Era 300', 'Enceinte connectee avec audio spatial Dolby Atmos', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90&fit=crop', 499.00, true),
('Marshall Stanmore III', 'Enceinte Bluetooth au design iconique Marshall', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=90&fit=crop', 379.00, true);

-- ============================================
-- MONTRES & WEARABLES (5 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('Apple Watch Ultra 2', 'La montre Apple la plus robuste pour les athletes', 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=90&fit=crop', 899.00, true),
('Apple Watch Series 9', 'La montre connectee la plus avancee', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=90&fit=crop', 449.00, true),
('Samsung Galaxy Watch 6 Classic', 'Montre connectee Samsung avec lunette rotative', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90&fit=crop', 399.00, true),
('Garmin Fenix 7 Pro', 'Montre GPS multisports premium', 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=90&fit=crop', 799.00, true);

-- ============================================
-- PHOTO & VIDEO (5 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('Sony Alpha 7 IV', 'Hybride plein format polyvalent 33MP', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90&fit=crop', 2799.00, true),
('Canon EOS R6 Mark II', 'Hybride Canon rapide et polyvalent', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=90&fit=crop', 2599.00, true),
('GoPro Hero 12 Black', 'Camera d''action 5.3K avec stabilisation HyperSmooth', 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800&q=90&fit=crop', 449.00, true),
('DJI Pocket 3', 'Camera gimbal de poche pour vlogs', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=90&fit=crop', 519.00, true);

-- ============================================
-- DRONES (3 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('DJI Mavic 3 Pro', 'Drone professionnel avec triple camera Hasselblad', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=90&fit=crop', 2199.00, true),
('DJI Mini 4 Pro', 'Drone compact sous 249g avec camera 4K', 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&q=90&fit=crop', 959.00, true),
('DJI Avata 2', 'Drone FPV immersif pour debutants', 'https://images.unsplash.com/photo-1521405924368-64c5b84bec60?w=800&q=90&fit=crop', 579.00, true);

-- ============================================
-- TV & HOME CINEMA (4 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('LG OLED C3 65"', 'TV OLED 4K 65 pouces avec processeur Alpha 9 Gen 6', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=90&fit=crop', 1799.00, true),
('Samsung QN90C 55"', 'TV Neo QLED 4K avec Quantum Matrix', 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=90&fit=crop', 1299.00, true),
('Sony Bravia XR A80L 55"', 'TV OLED Google TV avec Cognitive Processor XR', 'https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=800&q=90&fit=crop', 1599.00, true),
('Sonos Arc', 'Barre de son premium Dolby Atmos', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=90&fit=crop', 899.00, true);

-- ============================================
-- MOBILITE ELECTRIQUE (5 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('Xiaomi Electric Scooter 4 Pro', 'Trottinette electrique 25km/h autonomie 55km', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90&fit=crop', 599.00, true),
('Segway Ninebot Max G2', 'Trottinette premium longue autonomie 70km', 'https://images.unsplash.com/photo-1604868189265-219ba7ffc595?w=800&q=90&fit=crop', 949.00, true),
('VanMoof S5', 'Velo electrique connecte design hollandais', 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=90&fit=crop', 2998.00, true),
('Cowboy 4', 'Velo electrique urbain connecte made in Belgium', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90&fit=crop', 2990.00, true);

-- ============================================
-- MOTOS & SCOOTERS (3 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('Vespa Elettrica', 'Le scooter italien iconique en version electrique', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90&fit=crop', 7490.00, true),
('BMW CE 04', 'Scooter electrique futuriste BMW', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=90&fit=crop', 12100.00, true),
('Zero SR/F', 'Moto electrique sportive 190km/h', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=90&fit=crop', 21990.00, true);

-- ============================================
-- ELECTROMENAGER PREMIUM (3 produits)
-- ============================================
INSERT INTO items (name, description, image_url, retail_value, is_active) VALUES
('Dyson V15 Detect', 'Aspirateur sans fil avec detection laser des poussieres', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=90&fit=crop', 749.00, true),
('Thermomix TM6', 'Robot cuiseur multifonction Vorwerk', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=90&fit=crop', 1499.00, true),
('Dyson Airwrap Complete', 'Coiffeur multi-embouts sans chaleur extreme', 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&q=90&fit=crop', 549.00, true);

-- Verification
SELECT COUNT(*) as total_items FROM items WHERE is_active = true;
