require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE}/admin/api/2024-07/graphql.json`;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

app.post('/api/create-bundle', async (req, res) => {
  try {
    const products = req.body.products;
    const mainProductId = `gid://shopify/Product/${req.body.mainProductId}`;
    const mainProductTitle = req.body.mainProductTitle || 'Bundle - Any 5 Pieces - 70% OFF';

  const components = products.map(product => ({
  productId: `gid://shopify/Product/${product.productId}`,
  quantity: product.quantity,
  optionSelections: product.options.map(opt => ({
    componentOptionId: opt.id, // <-- must exist in your input!
    name: opt.name,
    values: [opt.value]
  }))
}));

// Log all optionSelections for debugging
components.forEach((c, i) => {
  console.log(`Component ${i} optionSelections:`, c.optionSelections);
});


   const bundleMutation = `
  mutation {
    productBundleUpdate(
      input: {
        productId: "${mainProductId}",
        title: "${mainProductTitle}",
        components: [
          ${components.map(component => `
            {
              productId: "${component.productId}",
              quantity: ${component.quantity},
              optionSelections: [
                ${component.optionSelections.map(sel => `
                  {
                    componentOptionId: "${sel.componentOptionId}",
                    name: "${sel.name}",
                    values: ["${sel.values[0]}"]
                  }
                `).join(',')}
              ]
            }
          `).join(',')}
        ]
      }
    ) {
      userErrors {
        field
        message
      }
      productBundleOperation {
        product {
          id
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  }
`;


    // const bundleMutation = `
    //  mutation {
    //   productBundleCreate(
    //     input: {
    //       title: "Bundle Builder",
    //       components: [
    //         {
    //           productId: "gid://shopify/Product/8393959112971",
    //           quantity: 1,
    //           optionSelections: [
    //             {
    //               componentOptionId: "gid://shopify/ProductOption/10687583912203",
    //               name: "Farbe",
    //               values: "Gold"
    //             }
    //           ]
    //         },
    //         {
    //           productId: "gid://shopify/Product/8393959112971",
    //           quantity: 2,
    //           optionSelections: [
    //             {
    //               componentOptionId: "gid://shopify/ProductOption/10687583912203",
    //               name: "Farbe",
    //               values: "Gold"
    //             }
    //           ]
    //         }
    //       ]
    //     }
    //   ) {
    //     userErrors {
    //       field
    //       message
    //     }
    //   }
    // }
    // `;

    const bundleResponse = await fetch(SHOPIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query: bundleMutation }),
    });

    const bundleData = await bundleResponse.json();
    console.log('Bundle Data:', bundleData);
    res.json(bundleData);

  } catch (error) {
    console.error('Unexpected server error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
