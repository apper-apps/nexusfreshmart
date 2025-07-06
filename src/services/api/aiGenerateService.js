import aiGenerateHistory from '@/services/mockData/aiGenerateHistory';

let data = [...aiGenerateHistory];
let nextId = Math.max(...data.map(item => item.Id)) + 1;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced food-specific prompt engineering
const generateFoodPrompt = (prompt, type, style, foodCategory) => {
  const styleModifiers = {
    'photorealistic': 'photorealistic, ultra-detailed, professional photography',
    'food-styling': 'food styling, gourmet presentation, artistic plating',
    'commercial': 'commercial photography, product shot, marketing quality',
    'rustic': 'rustic, natural lighting, organic, farm-to-table aesthetic',
    'modern-minimal': 'modern minimalist, clean aesthetic, contemporary',
    'artistic': 'artistic, creative composition, artistic lighting'
  };

  const categoryEnhancements = {
    'fruits': 'fresh, vibrant colors, natural textures, organic shapes',
    'vegetables': 'farm-fresh, natural lighting, crisp textures, garden fresh',
    'meat-seafood': 'premium quality, marbled textures, professional butcher presentation',
    'dairy': 'creamy textures, fresh, wholesome, artisanal quality',
    'bakery': 'golden brown, flaky textures, warm lighting, artisanal craftsmanship',
    'beverages': 'refreshing, condensation, perfect pour, crystal clear',
    'prepared-meals': 'home-cooked, steaming hot, comfort food, family-style',
    'snacks': 'crispy textures, appealing colors, snack-size portions'
  };

  const typeSpecific = {
    'food-photography': 'food photography, studio lighting, macro lens',
    'product-showcase': 'product showcase, 360-degree view, multiple angles',
    'lifestyle-food': 'lifestyle photography, dining scene, social context',
    'ingredient-focus': 'ingredient focus, macro photography, texture details',
    'recipe-visual': 'recipe visualization, step-by-step, cooking process',
    'menu-item': 'menu item display, restaurant quality, appetizing presentation'
  };

  const qualityEnhancements = '8K resolution, professional lighting, sharp focus, vibrant colors, food-grade presentation, appetizing, Instagram-worthy, high-end food photography';

  return `${prompt}, ${styleModifiers[style] || ''}, ${typeSpecific[type] || ''}, ${categoryEnhancements[foodCategory] || ''}, ${qualityEnhancements}`;
};

// Mock CLIP validation
const validateImageQuality = async (imageUrl, prompt) => {
  await delay(1000); // Simulate CLIP processing time
  
  // Mock quality score based on prompt complexity and randomness
  const baseScore = Math.floor(Math.random() * 20) + 75; // 75-95% range
  const promptComplexity = prompt.split(' ').length;
  const complexityBonus = Math.min(promptComplexity * 0.5, 10);
  
  const qualityScore = Math.min(baseScore + complexityBonus, 98);
  const validated = qualityScore > 80;
  
  return {
    qualityScore: Math.round(qualityScore),
    validated,
    feedback: validated 
      ? 'Image meets quality standards for food photography'
      : 'Image quality could be improved - consider adjusting prompt or style'
  };
};

// Mock DALL-E 3 image generation
const generateDalleImage = async (enhancedPrompt, size) => {
  await delay(3000); // Simulate DALL-E 3 processing time
  
  // In real implementation, this would call OpenAI's DALL-E 3 API
  // For now, we'll generate a mock image URL
  const mockImageUrl = `https://picsum.photos/${size.replace('x', '/')}?random=${Date.now()}`;
  
  return {
    imageUrl: mockImageUrl,
    revisedPrompt: enhancedPrompt,
    size: size
  };
};

const generateMockContent = (prompt, type, category) => {
  const templates = {
    'product-description': `**${prompt}**\n\nExperience the premium quality of our ${prompt.toLowerCase()}. Crafted with attention to detail, this product offers exceptional value and performance. Features include:\n\n• Premium materials and construction\n• Ergonomic design for comfort\n• Long-lasting durability\n• Easy maintenance and care\n\nPerfect for both professional and personal use. Order now and discover why customers trust our quality.`,
    
    'blog-post': `# ${prompt}\n\nIn today's fast-paced world, ${prompt.toLowerCase()} has become increasingly important. This comprehensive guide explores the key aspects you need to know.\n\n## Key Points\n\n1. **Understanding the Basics**: Every journey starts with foundational knowledge\n2. **Best Practices**: Learn from industry experts\n3. **Common Mistakes**: Avoid these pitfalls\n4. **Future Trends**: Stay ahead of the curve\n\n## Conclusion\n\nBy following these guidelines, you'll be well-equipped to succeed. Remember, consistency is key to achieving your goals.`,
    
    'social-media': `🔥 ${prompt} 🔥\n\nReady to transform your experience? Our latest ${prompt.toLowerCase()} is here!\n\n✨ Key features:\n• Premium quality\n• Affordable pricing\n• Fast delivery\n• 100% satisfaction guarantee\n\nDon't miss out! Limited time offer 🎯\n\n#FreshMart #Quality #${prompt.replace(/\s+/g, '')} #ShopNow`,
    
    'email': `Subject: Exciting News About ${prompt}!\n\nHi [Name],\n\nWe're thrilled to share something special with you. Our new ${prompt.toLowerCase()} is now available and it's everything you've been waiting for.\n\nWhat makes it special:\n• Carefully selected for quality\n• Competitively priced\n• Ready for immediate delivery\n\nAs a valued customer, you get early access. Click below to explore:\n\n[Shop Now Button]\n\nBest regards,\nThe FreshMart Team`,
    
    'campaign': `🎯 ${prompt} Campaign Copy\n\n**Headline**: "Discover the Difference Quality Makes"\n\n**Body**: Transform your experience with our premium ${prompt.toLowerCase()}. Join thousands of satisfied customers who've made the switch.\n\n**Features**:\n• Guaranteed quality\n• Unbeatable prices\n• Fast, reliable delivery\n• 30-day money-back guarantee\n\n**Call-to-Action**: "Start Your Journey Today"\n\n**Urgency**: Limited time offer - Don't miss out!`,
    
    'advertisement': `🌟 ${prompt} - Now Available! 🌟\n\nWhy choose us?\n✅ Premium quality guaranteed\n✅ Competitive pricing\n✅ Fast delivery nationwide\n✅ Expert customer support\n\nSpecial Launch Offer:\n🎁 Free shipping on orders over Rs. 1000\n🎁 10% discount for first-time customers\n\nOrder now and experience the difference!\n\n📞 Call: 1-800-FRESH-MART\n🌐 Visit: freshmart.com\n\n*Terms and conditions apply`
  };

  return templates[type] || `Generated content for ${prompt} (${type}):\n\nThis is a sample AI-generated content based on your prompt. In a real implementation, this would be generated using actual AI services like OpenAI, Claude, or other AI providers.\n\nThe content would be tailored to your specific requirements and context.`;
};

export const aiGenerateService = {
  async generateContent({ prompt, type, category }) {
    await delay(2000); // Simulate AI processing time
    
    const content = generateMockContent(prompt, type, category);
    
    // Create a new history entry
    const historyEntry = {
      Id: nextId++,
      prompt,
      type,
      category,
      content,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
    
    data.unshift(historyEntry);
    
    return {
      content,
      id: historyEntry.Id,
      metadata: {
        prompt,
        type,
        category,
        generatedAt: historyEntry.createdAt
      }
    };
  },

  async generateImage({ prompt, type, style, size, foodCategory, qualityValidation }) {
    try {
      // Generate enhanced prompt with food-specific optimizations
      const enhancedPrompt = generateFoodPrompt(prompt, type, style, foodCategory);
      
      // Generate image using DALL-E 3 (mock implementation)
      const dalleResult = await generateDalleImage(enhancedPrompt, size);
      
      // Validate image quality using CLIP if enabled
      let validationResult = null;
      if (qualityValidation) {
        validationResult = await validateImageQuality(dalleResult.imageUrl, enhancedPrompt);
      }
      
      const imageData = {
        imageUrl: dalleResult.imageUrl,
        revisedPrompt: dalleResult.revisedPrompt,
        size: dalleResult.size,
        style: style,
        foodCategory: foodCategory,
        qualityScore: validationResult?.qualityScore || null,
        validated: validationResult?.validated || false,
        feedback: validationResult?.feedback || null
      };
      
      // Create history entry
      const historyEntry = {
        Id: nextId++,
        prompt,
        type,
        category: 'images',
        content: dalleResult.imageUrl,
        image: imageData,
        createdAt: new Date().toISOString(),
        status: 'completed',
        metadata: {
          enhancedPrompt,
          style,
          size,
          foodCategory,
          qualityValidation
        }
      };
      
      data.unshift(historyEntry);
      
      return imageData;
      
    } catch (error) {
      console.error('DALL-E 3 image generation failed:', error);
      throw new Error('Failed to generate image with DALL-E 3. Please try again.');
    }
  },

  async getHistory() {
    await delay(300);
    return [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

async saveGenerated({ content, image, prompt, type, category, metadata }) {
    await delay(400);
    
    const existingIndex = data.findIndex(item => 
      item.prompt === prompt && item.type === type && item.category === category
    );
    
    if (existingIndex !== -1) {
      data[existingIndex] = {
        ...data[existingIndex],
        content,
        image: image || data[existingIndex].image,
        metadata: metadata || data[existingIndex].metadata,
        updatedAt: new Date().toISOString()
      };
      return data[existingIndex];
    } else {
      const newEntry = {
        Id: nextId++,
        prompt,
        type,
        category,
        content,
        image,
        metadata,
        createdAt: new Date().toISOString(),
        status: 'saved'
      };
      
      data.unshift(newEntry);
      return newEntry;
    }
  },

  async deleteGenerated(id) {
    await delay(200);
    
    const index = data.findIndex(item => item.Id === id);
    if (index === -1) {
      throw new Error('Generation not found');
    }
    
    data.splice(index, 1);
    return { success: true };
  },

  async getById(id) {
    await delay(200);
    
    const item = data.find(item => item.Id === id);
    if (!item) {
      throw new Error('Generation not found');
    }
    
    return { ...item };
  },

  async getAll() {
    await delay(300);
    return [...data];
  },

  async create(item) {
    await delay(400);
    
    const newItem = {
      Id: nextId++,
      ...item,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
    
    data.unshift(newItem);
    return newItem;
  },

  async update(id, updates) {
    await delay(400);
    
    const index = data.findIndex(item => item.Id === id);
    if (index === -1) {
      throw new Error('Generation not found');
    }
    
    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return data[index];
  },

  async delete(id) {
    return this.deleteGenerated(id);
  }
};