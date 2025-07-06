import aiGenerateHistory from '@/services/mockData/aiGenerateHistory';

let data = [...aiGenerateHistory];
let nextId = Math.max(...data.map(item => item.Id)) + 1;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateMockContent = (prompt, type, category) => {
  const templates = {
    'product-description': `**${prompt}**\n\nExperience the premium quality of our ${prompt.toLowerCase()}. Crafted with attention to detail, this product offers exceptional value and performance. Features include:\n\n• Premium materials and construction\n• Ergonomic design for comfort\n• Long-lasting durability\n• Easy maintenance and care\n\nPerfect for both professional and personal use. Order now and discover why customers trust our quality.`,
    
    'blog-post': `# ${prompt}\n\nIn today's fast-paced world, ${prompt.toLowerCase()} has become increasingly important. This comprehensive guide explores the key aspects you need to know.\n\n## Key Points\n\n1. **Understanding the Basics**: Every journey starts with foundational knowledge\n2. **Best Practices**: Learn from industry experts\n3. **Common Mistakes**: Avoid these pitfalls\n4. **Future Trends**: Stay ahead of the curve\n\n## Conclusion\n\nBy following these guidelines, you'll be well-equipped to succeed. Remember, consistency is key to achieving your goals.`,
    
    'social-media': `🔥 ${prompt} 🔥\n\nReady to transform your experience? Our latest ${prompt.toLowerCase()} is here!\n\n✨ Key features:\n• Premium quality\n• Affordable pricing\n• Fast delivery\n• 100% satisfaction guarantee\n\nDon't miss out! Limited time offer 🎯\n\n#FreshMart #Quality #${prompt.replace(/\s+/g, '')} #ShopNow`,
    
    'email': `Subject: Exciting News About ${prompt}!\n\nHi [Name],\n\nWe're thrilled to share something special with you. Our new ${prompt.toLowerCase()} is now available and it's everything you've been waiting for.\n\nWhat makes it special:\n• Carefully selected for quality\n• Competitively priced\n• Ready for immediate delivery\n\nAs a valued customer, you get early access. Click below to explore:\n\n[Shop Now Button]\n\nBest regards,\nThe FreshMart Team`,
    
    'product-photo': `AI-Generated Product Photography Prompt:\n\n"Professional product photography of ${prompt}, clean white background, studio lighting, high resolution, commercial quality, multiple angles, macro details, lifestyle context, soft shadows, vibrant colors, 4K resolution"`,
    
    'banner': `Marketing Banner Design for ${prompt}:\n\n• Main headline: "Premium ${prompt} Available Now"\n• Subtext: "Quality You Can Trust"\n• Color scheme: Fresh greens and whites\n• Call-to-action: "Shop Today"\n• Visual elements: Product imagery, discount badge\n• Dimensions: 1920x1080px\n• Format: JPG/PNG`,
    
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

  async getHistory() {
    await delay(300);
    return [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async saveGenerated({ content, prompt, type, category }) {
    await delay(400);
    
    const existingIndex = data.findIndex(item => 
      item.prompt === prompt && item.type === type && item.category === category
    );
    
    if (existingIndex !== -1) {
      data[existingIndex] = {
        ...data[existingIndex],
        content,
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