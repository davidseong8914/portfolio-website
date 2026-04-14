document.addEventListener('DOMContentLoaded', () => {
    const defaultImages = [
        "static/img/default/example_bbox.jpg",
        "static/img/default/example_crop.jpg",
        "static/img/default/example_ellipse.jpg",
        "static/img/default/example_circle_crop.jpg",
        "static/img/default/example_feature.jpg",
        "static/img/default/example_OCR.jpg",
        "static/img/default/example_num_ang.png",
        "static/img/default/example_cook.jpg",
        "static/img/default/example_needle.jpg",
        "static/img/default/example_needle_angle.jpg",
        "static/img/default/example_gauge_value.jpg"
    ];

    const imageContainers = [
        'bbox-container',
        'crop-container',
        'ellipse-container',
        'ellipse-crop-container',
        'feature-container',
        'ocr-container',
        'num-ang-container',
        'cook-container',
        'needle-container',
        'needle-angle-container',
        'gauge-value-container'
    ];

    imageContainers.forEach((id, index) => {
        const container = document.getElementById(id);
        container.innerHTML = ''; // Clear any existing images

        const img = document.createElement('img');
        img.src = defaultImages[index];
        img.alt = 'Default Image';
        img.classList.add('default-image');
        container.appendChild(img);
    });
});

function selectGauge(type) {
    const gaugeImages = {
        single: {
            example: "static/img/gauge_1_1.jpg",
            bbox: ['static/img/single/single_gauge_bbox.jpg'],
            crop: ['static/img/single/single_gauge_crop.jpg'],
            ellipse: ['static/img/single/single_gauge_ellipse.jpg'],
            ellipseCrop: ['static/img/single/single_gauge_ellipse_crop.jpg'],
            feature: ['static/img/single/single_gauge_feature.jpg'],
            ocr: ['static/img/single/single_gauge_ocr.jpg'],
            numAng: ['static/img/single/single_gauge_num_ang.jpg'],
            cook: ['static/img/single/single_gauge_cook.jpg'],
            needle: ['static/img/single/single_gauge_needle.jpg'],
            needleAngle: ['static/img/single/single_gauge_needle_angle.jpg'],
            gaugeValue: ['static/img/single/single_gauge_value.jpg']
        },
        multiple: {
            example: "static/img/gauge_1_3.png",
            bbox: [
                "static/img/multiple/multiple_gauge_bbox_1.jpg",
                "static/img/multiple/multiple_gauge_bbox_2.jpg",
                "static/img/multiple/multiple_gauge_bbox_3.jpg"
            ],
            crop: [
                "static/img/multiple/multiple_gauge_crop_1.jpg",
                "static/img/multiple/multiple_gauge_crop_2.jpg",
                "static/img/multiple/multiple_gauge_crop_3.jpg"
            ],
            ellipse: [
                "static/img/multiple/multiple_gauge_ellipse_1.jpg",
                "static/img/multiple/multiple_gauge_ellipse_2.jpg",
                "static/img/multiple/multiple_gauge_ellipse_3.jpg"
            ],
            ellipseCrop: [
                "static/img/multiple/multiple_gauge_ellipse_crop_1.jpg",
                "static/img/multiple/multiple_gauge_ellipse_crop_2.jpg",
                "static/img/multiple/multiple_gauge_ellipse_crop_3.jpg"
            ],
            feature: [
                "static/img/multiple/multiple_gauge_feature_1.jpg",
                "static/img/multiple/multiple_gauge_feature_2.jpg",
                "static/img/multiple/multiple_gauge_feature_3.jpg"
            ],
            ocr: [
                "static/img/multiple/multiple_gauge_ocr_1.jpg",
                "static/img/multiple/multiple_gauge_ocr_2.jpg",
                "static/img/multiple/multiple_gauge_ocr_3.jpg"
            ],
            numAng: [
                "static/img/multiple/multiple_gauge_num_ang_1.jpg",
                "static/img/multiple/multiple_gauge_num_ang_2.jpg",
                "static/img/multiple/multiple_gauge_num_ang_3.jpg"
            ],
            cook: [
                "static/img/multiple/multiple_gauge_cook_1.jpg",
                "static/img/multiple/multiple_gauge_cook_2.jpg",
                "static/img/multiple/multiple_gauge_cook_3.jpg"
            ],
            needle: [
                "static/img/multiple/multiple_gauge_needle_1.jpg",
                "static/img/multiple/multiple_gauge_needle_2.jpg",
                "static/img/multiple/multiple_gauge_needle_3.jpg"
            ],
            needleAngle: [
                "static/img/multiple/multiple_gauge_needle_angle_1.jpg",
                "static/img/multiple/multiple_gauge_needle_angle_2.jpg",
                "static/img/multiple/multiple_gauge_needle_angle_3.jpg"
            ],
            gaugeValue: [
                "static/img/multiple/multiple_gauge_value_1.jpg",
                "static/img/multiple/multiple_gauge_value_2.jpg",
                "static/img/multiple/multiple_gauge_value_3.jpg"
            ]
        },
        digital: {
            example: "static/img/gauge_1_dg.jpg",
            bbox: ["static/img/digital/digital_gauge_bbox.jpg"],
            crop: ["static/img/digital/digital_gauge_crop.jpg"],
            ellipse: ["static/img/digital/digital_gauge_ellipse.jpg"],
            ellipseCrop: ["static/img/digital/digital_gauge_ellipse_crop.jpg"],
            feature: ["static/img/digital/digital_gauge_feature.jpg"],
            ocr: ["static/img/digital/digital_gauge_ocr.jpg"],
            numAng: ["static/img/digital/digital_gauge_num_ang.jpg"],
            cook: ["static/img/digital/digital_gauge_cook.jpg"],
            needle: ["static/img/digital/digital_gauge_needle.jpg"],
            needleAngle: ["static/img/digital/digital_gauge_needle_angle.jpg"],
            gaugeValue: ["static/img/digital/digital_gauge_value.jpg"]
        },
        mixed: {
            example: "static/img/gauge_1_mix.jpg",
            bbox: [
                "static/img/mixed/mixed_gauge_bbox_1.jpg",
                "static/img/mixed/mixed_gauge_bbox_2.jpg",
                "static/img/mixed/mixed_gauge_bbox_3.jpg"
            ],
            crop: [
                "static/img/mixed/mixed_gauge_crop_1.jpg",
                "static/img/mixed/mixed_gauge_crop_2.jpg",
                "static/img/mixed/mixed_gauge_crop_3.jpg"
            ],
            ellipse: [
                "static/img/mixed/mixed_gauge_ellipse_1.jpg",
                "static/img/mixed/mixed_gauge_ellipse_2.jpg",
                "static/img/mixed/mixed_gauge_ellipse_3.jpg"
            ],
            ellipseCrop: [
                "static/img/mixed/mixed_gauge_ellipse_crop_1.jpg",
                "static/img/mixed/mixed_gauge_ellipse_crop_2.jpg",
                "static/img/mixed/mixed_gauge_ellipse_crop_3.jpg"
            ],
            feature: [
                "static/img/mixed/mixed_gauge_feature_1.jpg",
                "static/img/mixed/mixed_gauge_feature_2.jpg",
                "static/img/mixed/mixed_gauge_feature_3.jpg"
            ],
            ocr: [
                "static/img/mixed/mixed_gauge_ocr_1.jpg",
                "static/img/mixed/mixed_gauge_ocr_2.jpg",
                "static/img/mixed/mixed_gauge_ocr_3.jpg"
            ],
            numAng: [
                "static/img/mixed/mixed_gauge_num_ang_1.jpg",
                "static/img/mixed/mixed_gauge_num_ang_2.jpg",
                "static/img/mixed/mixed_gauge_num_ang_3.jpg"
            ],
            cook: [
                "static/img/mixed/mixed_gauge_cook_1.jpg",
                "static/img/mixed/mixed_gauge_cook_2.jpg",
                "static/img/mixed/mixed_gauge_cook_3.jpg"
            ],
            needle: [
                "static/img/mixed/mixed_gauge_needle_1.jpg",
                "static/img/mixed/mixed_gauge_needle_2.jpg",
                "static/img/mixed/mixed_gauge_needle_3.jpg"
            ],
            needleAngle: [
                "static/img/mixed/mixed_gauge_needle_angle_1.jpg",
                "static/img/mixed/mixed_gauge_needle_angle_2.jpg",
                "static/img/mixed/mixed_gauge_needle_angle_3.jpg"
            ],
            gaugeValue: [
                "static/img/mixed/mixed_gauge_value_1.jpg",
                "static/img/mixed/mixed_gauge_value_2.jpg",
                "static/img/mixed/mixed_gauge_value_3.jpg"
            ]
        }
    };

    // Function to update multiple images
    function updateImages(containerId, images) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear existing images

        images.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Gauge Image';
            img.classList.add('default-image');
            container.appendChild(img);
        });
    }

    // Remove the 'selected' class from all grid items
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(item => item.classList.remove('selected'));

    // Add the 'selected' class to the clicked grid item
    const selectedGridItem = document.querySelector(`.grid-item[data-type="${type}"]`);
    selectedGridItem.classList.add('selected');

    // Update the example gauge image
    document.getElementById('main-image').src = gaugeImages[type].example;  // Update this line

    // Update the corresponding images for each step
    updateImages('bbox-container', gaugeImages[type].bbox);
    updateImages('crop-container', gaugeImages[type].crop);
    updateImages('ellipse-container', gaugeImages[type].ellipse);
    updateImages('ellipse-crop-container', gaugeImages[type].ellipseCrop);
    updateImages('feature-container', gaugeImages[type].feature);
    updateImages('ocr-container', gaugeImages[type].ocr);
    updateImages('num-ang-container', gaugeImages[type].numAng);
    updateImages('cook-container', gaugeImages[type].cook);
    updateImages('needle-container', gaugeImages[type].needle);
    updateImages('needle-angle-container', gaugeImages[type].needleAngle);
    updateImages('gauge-value-container', gaugeImages[type].gaugeValue);
}
