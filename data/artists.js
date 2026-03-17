// Artists Database
const artistsDatabase = {
    admin: {
        name: 'ADMIN',
        emoji: '⚙️',
        description: 'Administrator Tools & Dashboard',
        revenueShare: 1.0,
        isSpecialTab: true,
        products: {}
    },
    pesa21: {
        name: 'PESA 21',
        emoji: '🎨',
        description: 'ORV master with prints & books',
        revenueShare: 0.5, // 50% revenue share
        products: {
            postcards: [
                { code: 'P21-ORV-PCD-SET-01-LE', name: 'ORV Postcard set 01 LIMITED EDITION', priceIDR: 225000, priceSGD: 15, costIDR: 40000, costSGD: 2.5, image: 'P21-ORV-PCD-SET-01.png' },
                { code: 'P21-ORV-PCD-SET-01-REG', name: 'ORV Postcard set 01 REGULAR EDITION', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'P21-ORV-PCD-SET-01.png' },
                { code: 'P21-ORV-PCD-SET-02-LE', name: 'ORV Postcard set 02 LIMITED EDITION', priceIDR: 300000, priceSGD: 20, costIDR: 50000, costSGD: 3.5, image: 'P21-ORV-PCD-SET-02-LE.png' },
                { code: 'P21-ORV-PCD-SET-02-REG', name: 'ORV Postcard set 02 REGULAR EDITION', priceIDR: 200000, priceSGD: 13, costIDR: 40000, costSGD: 2.5, image: 'P21-ORV-PCD-SET-02-REG.png' },
                { code: 'P21-BNHA-PCD', name: 'Postcard BNHA (Old) BNHA Prince singles', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'P21-BNHA-PCD.png' },
                { code: 'P21-BNHA-SET', name: 'BNHA Set', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'P21-BNHA-SET.png' },
                { code: 'P21-HQ-PCD', name: 'Postcard Haikyuu (Old)', priceIDR: 30000, priceSGD: 2, costIDR: 5000, costSGD: 0.3, image: 'P21-HQ-PCD.png' }
            ],
            polaroids: [
                { code: 'P21-ORV-POL-SET-01-HOLO', name: 'ORV Polaroid set 01 HOLOGRAM', priceIDR: 150000, priceSGD: 10, costIDR: 25000, costSGD: 1.7, image: 'P21-ORV-POL-SET-01-HOLO.png' },
                { code: 'P21-ORV-POL', name: 'ORV Polaroid (Singles) (Fancy)', priceIDR: 30000, priceSGD: 2, costIDR: 5000, costSGD: 0.3, image: 'p21-orv-pcd.png' },
                { code: 'P21-ORV-POL-SET-01-REG', name: 'ORV Polaroid set 01 REGULAR', priceIDR: 90000, priceSGD: 6, costIDR: 15000, costSGD: 1, image: 'P21-ORV-POL-SET-01-REG.png' },
                { code: 'P21-ORV-POL-CP', name: 'ORV Polaroid Jongdok New Matt & Sirio', priceIDR: 30000, priceSGD: 2, costIDR: 5000, costSGD: 0.3, image: 'P21-ORV-POL-CP.png' }
            ],
            prints: [
                { code: 'P21-ORV-PT-B5-01', name: 'ORV B5 Prints Sky Couple', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'P21-ORV-PT-B5-01.png' },
                { code: 'P21-ORV-PT-B5-02', name: 'KDJ Garden', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'P21-ORV-PT-B5-02.png' },
                { code: 'P21-ORV-PT-B5-03', name: 'YJH Black', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'P21-ORV-PT-B5-03.png' },
                { code: 'P21-ORV-PT-B5-04', name: 'YJH Flower', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'P21-ORV-PT-B5-04.png' }
            ],
            books: [
                { code: 'P21-ORV-BK-SL-01-LEB', name: 'Pesa21 sketchlog 01 Limited Edition (B-stock)', priceIDR: 300000, priceSGD: 20, costIDR: 60000, costSGD: 4, image: 'P21-ORV-BK-SL-01-LEB.jpg' },
                { code: 'P21-ORV-BK-SL-01-REG', name: 'Pesa21 sketchlog 01 Reguler', priceIDR: 270000, priceSGD: 18, costIDR: 54000, costSGD: 3.6, image: 'P21-ORV-BK-SL-01-REG.jpg' }
            ]
        }
    },
    gentlecat: {
        name: 'GENTLECAT',
        emoji: '🐱',
        description: 'HSR & GI specialist with huge catalog',
        revenueShare: 1.0, // 100% revenue share
        products: {
            photocards_hsr: [
                { code: 'GC-HSR-PC-AR', name: 'HSR PC Argenti', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-AR2.png' },
                { code: 'GC-HSR-PC-BL', name: 'HSR PC Blade', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-BR', name: 'HSR PC Bronya', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-CA', name: 'HSR PC Caelus', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-DH', name: 'HSR PC Danheng', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-DHIL', name: 'HSR PC Danheng IL', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-GP', name: 'HSR PC Gepard', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-HI', name: 'HSR PC Himeko', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-JY', name: 'HSR PC Jing Yuan', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-KF', name: 'HSR PC Kafka', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-LC', name: 'HSR PC Luocha', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-M7', name: 'HSR PC March 7', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-M72.png' },
                { code: 'GC-HSR-PC-SMP', name: 'HSR PC Sampo', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-SE', name: 'HSR PC Seele', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-SEELE.png' },
                { code: 'GC-HSR-PC-STL', name: 'HSR PC Stelle', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-WL', name: 'HSR PC Welt', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-PC-YQ', name: 'HSR PC Yanqing', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-HSR-BLADE.png' }
            ],
            photocards_gi: [
                { code: 'GC-GI-PC-CH', name: 'GI PC Childe', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-CH.png' },
                { code: 'GC-GI-PC-AH', name: 'GI PC AlHaitham', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-AH.png' },
                { code: 'GC-GI-PC-KV', name: 'GI PC Kaveh', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-KV.png' },
                { code: 'GC-GI-PC-AY', name: 'GI PC Ayato', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-AY.png' },
                { code: 'GC-GI-PC-TM', name: 'GI PC Thoma', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-TM.png' },
                { code: 'GC-GI-PC-WR', name: 'GI PC Wriothesley', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-WR.png' },
                { code: 'GC-GI-PC-NE', name: 'GI PC Neuvilette', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-NE.png' },
                { code: 'GC-GI-PC-DI', name: 'GI PC Diluc', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-DI.png' },
                { code: 'GC-GI-PC-KY', name: 'GI PC Kaeya', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-KY.png' },
                { code: 'GC-GI-PC-XI', name: 'GI PC Xiao', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-XI.png' },
                { code: 'GC-GI-PC-ZL', name: 'GI PC Zhongli', priceIDR: 22500, priceSGD: 1.5, costIDR: 4500, costSGD: 0.3, image: 'GC-GI-PC-ZL.png' }
            ],
            keychains_hsr: [
                { code: 'GC-HSR-KC-AR1', name: 'HSR KC Argenti Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-AR2.png' },
                { code: 'GC-HSR-KC-AR2', name: 'HSR KC Argenti Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-AR2.png' },
                { code: 'GC-HSR-KC-BL1', name: 'HSR KC Blade Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-BL2', name: 'HSR KC Blade Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-BR1', name: 'HSR KC Bronya Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-BR2', name: 'HSR KC Bronya Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-CA1', name: 'HSR KC Caelus Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-CA2', name: 'HSR KC Caelus Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-DH1', name: 'HSR KC Danheng Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-DH2', name: 'HSR KC Danheng Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-DHIL1', name: 'HSR KC Danheng IL Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-DHIL2', name: 'HSR KC Danheng IL Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-GP1', name: 'HSR KC Gepard Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-GP2', name: 'HSR KC Gepard Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-HI1', name: 'HSR KC Himeko Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-HI2', name: 'HSR KC Himeko Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-JY1', name: 'HSR KC Jing Yuan Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-JY2', name: 'HSR KC Jing Yuan Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-KF1', name: 'HSR KC Kafka Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-KF2', name: 'HSR KC Kafka Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-LC1', name: 'HSR KC Luocha Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-LC2', name: 'HSR KC Luocha Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-M71', name: 'HSR KC March 7 Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-M72.png' },
                { code: 'GC-HSR-KC-M72', name: 'HSR KC March 7 Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-M72.png' },
                { code: 'GC-HSR-KC-SMP1', name: 'HSR KC Sampo Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-SMP2', name: 'HSR KC Sampo Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-SE1', name: 'HSR KC Seele Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-SEELE.png' },
                { code: 'GC-HSR-KC-SE2', name: 'HSR KC Seele Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-SEELE.png' },
                { code: 'GC-HSR-KC-STL1', name: 'HSR KC Stelle Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-STL2', name: 'HSR KC Stelle Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-WL1', name: 'HSR KC Welt Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-WL2', name: 'HSR KC Welt Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-YQ1', name: 'HSR KC Yanqing Duduk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-KC-YQ2', name: 'HSR KC Yanqing Food', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, notes: '$8 for 2', image: 'GC-HSR-BLADE.png' }
            ],
            stickers_hsr: [
                { code: 'GC-HSR-ST-AR1', name: 'HSR ST Argenti Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-AR2.png' },
                { code: 'GC-HSR-ST-AR2', name: 'HSR ST Argenti Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-AR2.png' },
                { code: 'GC-HSR-ST-BL1', name: 'HSR ST Blade Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-BL2', name: 'HSR ST Blade Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-BR1', name: 'HSR ST Bronya Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-BR2', name: 'HSR ST Bronya Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-CA1', name: 'HSR ST Caelus Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-CA2', name: 'HSR ST Caelus Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-DH1', name: 'HSR ST Danheng Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-DH2', name: 'HSR ST Danheng Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-DHIL1', name: 'HSR ST Danheng IL Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-DHIL2', name: 'HSR ST Danheng IL Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-GP1', name: 'HSR ST Gepard Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-GP2', name: 'HSR ST Gepard Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-HI1', name: 'HSR ST Himeko Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-HI2', name: 'HSR ST Himeko Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-JY1', name: 'HSR ST Jing Yuan Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-JY2', name: 'HSR ST Jing Yuan Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-KF1', name: 'HSR ST Kafka Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-KF2', name: 'HSR ST Kafka Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-LC1', name: 'HSR ST Luocha Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-LC2', name: 'HSR ST Luocha Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-M71', name: 'HSR ST March 7 Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-M72.png' },
                { code: 'GC-HSR-ST-M72', name: 'HSR ST March 7 Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-M72.png' },
                { code: 'GC-HSR-ST-SMP1', name: 'HSR ST Sampo Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-SMP2', name: 'HSR ST Sampo Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-SE1', name: 'HSR ST Seele Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-SEELE.png' },
                { code: 'GC-HSR-ST-SE2', name: 'HSR ST Seele Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-SEELE.png' },
                { code: 'GC-HSR-ST-STL1', name: 'HSR ST Stelle Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-STL2', name: 'HSR ST Stelle Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-WL1', name: 'HSR ST Welt Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-WL2', name: 'HSR ST Welt Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-YQ1', name: 'HSR ST Yanqing Duduk', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-HSR-BLADE.png' },
                { code: 'GC-HSR-ST-YQ2', name: 'HSR ST Yanqing Food', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-HSR-BLADE.png' }
            ],
            stickers_gi: [
                { code: 'GC-GI-ST-MIAO-01', name: 'GI Sticker Miao 01 Pink', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-GI-ST-MIAO1.png' },
                { code: 'GC-GI-ST-MIAO-02', name: 'GI Sticker Miao 01 Blue', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-GI-ST-MIAO2.png' }
            ],
            standees: [
                { code: 'GC-ORV-STN-SET-JD', name: 'ORV Jungdok café standee set Local (B-Stock)', priceIDR: 450000, priceSGD: 30, costIDR: 90000, costSGD: 6, image: 'GC-ORV-STN-SET-JD.png' },
                { code: 'GC-GI-STN-SET-HKV', name: 'GI Haikaveh café standee set A Stock sale', priceIDR: 750000, priceSGD: 50, costIDR: 150000, costSGD: 10, image: 'GC-GI-STN-SET-HKV.png' },
                { code: 'GC-GI-STN-CH', name: 'GI Standee Childe', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-CH.png' },
                { code: 'GC-GI-STN-AY', name: 'GI Standee Ayato', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-AY.png' },
                { code: 'GC-GI-STN-TM', name: 'GI Standee Thoma', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-TM.png' },
                { code: 'GC-GI-STN-KY', name: 'GI Standee Kaeya', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-KY.png' },
                { code: 'GC-GI-STN-DL', name: 'GI Standee Diluc', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-DL.png' },
                { code: 'GC-GI-STN-ZL', name: 'GI Standee Zhongli', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-ZL.png' },
                { code: 'GC-GI-STN-XI', name: 'GI Standee Xiao', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-XI.png' },
                { code: 'GC-GI-STN-AH', name: 'GI Standee AlHaitham', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-AH.png' },
                { code: 'GC-GI-STN-KV', name: 'GI Standee Kaveh', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-KV.png' },
                { code: 'GC-GI-STN-WR', name: 'GI Standee Wriothesley', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-WR.png' },
                { code: 'GC-GI-STN-NE', name: 'GI Standee Neuvillette', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'GC-GI-STN-NE.png' }
            ],
            cat_prints: [
                { code: 'GC-CAT-PT-AVCD', name: 'Cat prints Alpukat / Avocado', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-AVCD.png' },
                { code: 'GC-CAT-PT-BAGT', name: 'Cat prints Baguette', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-BAGT.png' },
                { code: 'GC-CAT-PT-BLUE', name: 'Cat prints Blue Persia', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-BLUE.png' },
                { code: 'GC-CAT-PT-CAF', name: 'Cat print Café Mood', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-CAF.png' },
                { code: 'GC-CAT-PT-CLCK', name: 'Cat prints Calico Kasur', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-CLCK.png' },
                { code: 'GC-CAT-PT-CHNK', name: 'Cat prints Chonk Perut / Goler', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-CHNK.png' },
                { code: 'GC-CAT-PT-FLF', name: 'Cat prints Fluffy Scottish Fold', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-FLF.png' },
                { code: 'GC-CAT-PT-GGT', name: 'Cat prints Gigit', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-GGT.png' },
                { code: 'GC-CAT-PT-KCA', name: 'Cat prints Kaca / Mirror', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-KCA.png' },
                { code: 'GC-CAT-PT-KLEE', name: 'Cat prints Klee', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-KLEE.png' },
                { code: 'GC-CAT-PT-PNCK', name: 'Cat prints Pancake tumpuk', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-PNCK.png' },
                { code: 'GC-CAT-PT-PNY', name: 'Cat prints Penyet / Tetris', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-PNY.png' },
                { code: 'GC-CAT-PT-KNF', name: 'Cat prints Knife Cat & Dog', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-KNF.png' },
                { code: 'GC-CAT-PT-SNOW', name: 'Cat prints Snow', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-SNOW.png' },
                { code: 'GC-CAT-PT-STRO', name: 'Cat prints Strawberry', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'GC-CAT-PT-STRO.png' }
            ]
        }
    },
    limsera: {
        name: 'LIM SERA',
        emoji: '📚',
        description: 'Books & doujinshi specialist (KISSPAGE11)',
        revenueShare: 1.0,
        products: {
            books: [
                { code: 'LS-ORI-BK-SL01', name: 'Original Sketchlog Book 01', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'LS-ORI-BK-SL01.png' },
                { code: 'LS-SEN-BK-WASL', name: 'Sen Washi Sketchlog', priceIDR: 100000, priceSGD: 7, costIDR: 20000, costSGD: 1.4, image: 'LS-SEN-BK-WASL.png' }
            ]
        }
    },
    discounted: {
        name: 'SALE ITEMS',
        emoji: '💸',
        description: 'Clearance & discounted items',
        revenueShare: 1.0,
        products: {
            clearance: [
                { code: 'LS-KC-IDV', name: 'Identity V Keychain', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'LS-KC-IDV.png' },
                { code: 'LS-PCD-IDV', name: 'Identity V Postcards', priceIDR: 20000, priceSGD: 1.5, costIDR: 4000, costSGD: 0.3, image: 'LS-PCD-IDV.png' },
                { code: 'OLD-BK-KANC', name: 'Old Book - Kancil Stories', priceIDR: 50000, priceSGD: 3.5, costIDR: 10000, costSGD: 0.7, image: 'OLD-BK-KANC.png' },
                { code: 'OLD-BK-SENRI', name: 'Old Book - Senri Collection', priceIDR: 50000, priceSGD: 3.5, costIDR: 10000, costSGD: 0.7, image: 'OLD-BK-SENRI.png' },
                { code: 'CLEAR-FILES', name: 'Clear File Sets', priceIDR: 25000, priceSGD: 1.5, costIDR: 5000, costSGD: 0.3, image: 'LS-KC-IDV.png' },
                { code: 'KNY-KC-OLD', name: 'Kimetsu No Yaiba Keychain (Old)', priceIDR: 20000, priceSGD: 1.5, costIDR: 4000, costSGD: 0.3, image: 'LS-KC-IDV.png' }
            ]
        }
    },
    blindbox: {
        name: 'BLIND BOX',
        emoji: '📦',
        description: 'Collectible blind box figures',
        revenueShare: 1.0,
        products: {
            blindbox: [
                { code: 'BB-HARRY-POTTER', name: 'Harry Potter Blind Box', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'HARRYPOTTERBLINDBOX.png' },
                { code: 'BB-MIAOLINGDANG', name: 'Miao Ling Dang Blind Box', priceIDR: 60000, priceSGD: 4, costIDR: 12000, costSGD: 0.8, image: 'MIAOLINGDANG.png' },
                { code: 'BB-REMENT', name: 'Re-ment Miniature Set', priceIDR: 90000, priceSGD: 6, costIDR: 18000, costSGD: 1.2, image: 'REMENT.png' },
                { code: 'BB-FOODBB-SMALL', name: 'Food Blind Box Small', priceIDR: 45000, priceSGD: 3, costIDR: 9000, costSGD: 0.6, image: 'FOODBBSMALL.png' },
                { code: 'BB-TEENAR', name: 'Teenar Figures', priceIDR: 75000, priceSGD: 5, costIDR: 15000, costSGD: 1, image: 'TEENAR.png' }
            ]
        }
    },
    erebun: {
        name: 'EREBUN',
        emoji: '🔮',
        description: 'ORV & HSR special items',
        revenueShare: 1.0,
        products: {
            photocards: [
                { code: 'ERE-ORV-PC-SET-01', name: 'ORV PC set', priceIDR: 60000, priceSGD: 4, costIDR: 12000, costSGD: 0.8, image: 'ERE-ORV-PC-SET-01.png' },
                { code: 'ERE-HSR-PC-DR', name: 'HSR PC Dr. Ratio', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'ere-hsr-pc-dr.png' },
                { code: 'ERE-HSR-PC-AVE', name: 'HSR PC Aventurine', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'ere-hsr-pc-ave.png' }
            ],
            standees: [
                { code: 'ERE-ORV-ST-YJH', name: 'ORV Standee Yoo Junghyeok', priceIDR: 300000, priceSGD: 20, costIDR: 60000, costSGD: 4, image: 'ERE-ORV-ST.png' },
                { code: 'ERE-ORV-ST-KDJ', name: 'ORV Standee Kim Dokja', priceIDR: 300000, priceSGD: 20, costIDR: 60000, costSGD: 4, image: 'ERE-ORV-ST.png' },
                { code: 'ERE-HSR-ST-AVE', name: 'HSR Standee Aventurine', priceIDR: 300000, priceSGD: 20, costIDR: 60000, costSGD: 4, image: 'ERE-HSR-ST-AVE.png' },
                { code: 'ERE-HSR-ST-DR', name: 'HSR Standee Dr. Ratio', priceIDR: 300000, priceSGD: 20, costIDR: 60000, costSGD: 4, image: 'ERE-HSR-ST-DR.png' }
            ],
            keychains: [
                { code: 'ERE-ORV-KC-SET-01', name: 'ORV Keychain Pinch set Large ver (Kuien)', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'ERE-ORV-KC-SET-01.png' },
                { code: 'ERE-HSR-KC-SET-01', name: 'Ratiorine keychain Set Glitter 4.5 x 4.5', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'ERE-ORV-KC-SET-01.png' }
            ],
            stickers: [
                { code: 'ERE-HSR-ST-DR', name: 'HSR Sticker Dr. Ratio', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'ere-hsr-pc-dr.png' },
                { code: 'ERE-HSR-ST-AVE', name: 'HSR Sticker Aventurine', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'ere-hsr-pc-ave.png' }
            ]
        }
    },
    bags: {
        name: 'BAGS & ACC',
        emoji: '👜',
        description: 'Card sleeves & storage accessories',
        revenueShare: 1.0,
        products: {
            accessories: [
                { code: 'ACC-CARD-SLEEVE', name: 'CARD hard SLEEVE postcard', priceIDR: 15000, priceSGD: 1, costIDR: 3000, costSGD: 0.2, image: 'GC-CAT-PT-AVCD.png' },
                { code: 'ACC-PVC-BAG-BIG', name: 'PVC Bag big', priceIDR: 45000, priceSGD: 3, costIDR: 9000, costSGD: 0.6, image: 'GC-CAT-PT-AVCD.png' },
                { code: 'ACC-PVC-CARD-TIPIS', name: 'PVC Card tipis', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-CAT-PT-AVCD.png' },
                { code: 'ACC-PVC-BAG-SMOL', name: 'PVC Bag smol', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'GC-CAT-PT-AVCD.png' }
            ]
        }
    },
    kouwarra: {
        name: 'KOUWARRA',
        emoji: '🌸',
        description: 'ORV omamori specialist',
        revenueShare: 1.0,
        products: {
            omamori: [
                { code: 'KW-ORV-STN-OMA', name: 'ORV Standee Omamori', priceIDR: 150000, priceSGD: 10, costIDR: 30000, costSGD: 2, image: 'P21-KDJ-ST.png' },
                { code: 'KW-ORV-KC-OMA', name: 'ORV Keychain Omamori', priceIDR: 45000, priceSGD: 3, costIDR: 9000, costSGD: 0.6, notes: '2 for $5', image: 'P21-KDJ-ST.png' }
            ]
        }
    },
    krom: {
        name: 'KROM',
        emoji: '🍰',
        description: 'ORV & GI dessert-themed items',
        revenueShare: 1.0,
        products: {
            keychains: [
                { code: 'KR-ORV-KC-STR', name: 'ORV Keychain Stars', priceIDR: 45000, priceSGD: 3, costIDR: 9000, costSGD: 0.6, notes: '2 for $5', image: 'MOLAXSQUID.png' },
                { code: 'KR-ORV-KC-MXS', name: 'ORV Keychain Mola x Squid', priceIDR: 45000, priceSGD: 3, costIDR: 9000, costSGD: 0.6, notes: '2 for $5', image: 'MOLAXSQUID.png' }
            ],
            stickers: [
                { code: 'KR-ORV-ST-MXS-SET', name: 'ORV Sticker Mola x Squid set', priceIDR: 30000, priceSGD: 2, costIDR: 6000, costSGD: 0.4, image: 'MOLAXSQUID.png' }
            ],
            candy_bags: [
                { code: 'KR-ORV-KCB-CRP-SET', name: 'ORV Candy Bag Crepe set A stock', priceIDR: 300000, priceSGD: 20, costIDR: 60000, costSGD: 4, image: 'MOLAXSQUID.png' }
            ],
            dessert_standees: [
                { code: 'KR-GI-STN-AH', name: 'GI Standee Dessert Alhaitham', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-AH.png' },
                { code: 'KR-GI-STN-KV', name: 'GI Standee Dessert Kaveh', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-KV.png' },
                { code: 'KR-GI-STN-TOM', name: 'GI Standee Dessert Tomo', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-TM.png' },
                { code: 'KR-GI-STN-KZH', name: 'GI Standee Dessert Kazuha', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-KV.png' },
                { code: 'KR-GI-STN-KY', name: 'GI Standee Dessert Kaeya', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-KY.png' },
                { code: 'KR-GI-STN-DL', name: 'GI Standee Dessert Diluc', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-DL.png' },
                { code: 'KR-GI-STN-AY', name: 'GI Standee Dessert Ayato', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-AY.png' },
                { code: 'KR-GI-STN-TM', name: 'GI Standee Dessert Thoma', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-TM.png' },
                { code: 'KR-GI-STN-CH', name: 'GI Standee Dessert Childe', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-CH.png' },
                { code: 'KR-GI-STN-ZL', name: 'GI Standee Dessert Zhongli', priceIDR: 120000, priceSGD: 8, costIDR: 24000, costSGD: 1.6, image: 'GC-GI-STN-ZL.png' }
            ]
        }
    },
    kisspage: {
        name: 'KISSPAGE',
        emoji: '📚',
        description: 'Books & doujinshi specialist',
        revenueShare: 1.0,
        products: {}
    }
};
