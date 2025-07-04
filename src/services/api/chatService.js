import mockConversations from '@/services/mockData/chatConversations';

class ChatService {
  constructor() {
    this.conversations = [...mockConversations];
    this.messages = [];
    this.nextId = Math.max(...mockConversations.map(c => c.Id), 0) + 1;
    this.nextMessageId = 1;
  }

  async getConversations() {
    await this.delay(300);
    return [...this.conversations];
  }

  async getById(id) {
    await this.delay(200);
    const conversation = this.conversations.find(c => c.Id === id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    return { ...conversation };
  }

  async createConversation(data) {
    await this.delay(300);
    const newConversation = {
      Id: this.nextId++,
      title: data.title || 'Support Chat',
      status: 'active',
      lastMessage: null,
      lastMessageAt: new Date().toISOString(),
      orderContext: data.orderContext || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.conversations.push(newConversation);
    return { ...newConversation };
  }

  async updateConversation(id, data) {
    await this.delay(300);
    const index = this.conversations.findIndex(c => c.Id === id);
    if (index === -1) {
      throw new Error('Conversation not found');
    }
    
    this.conversations[index] = {
      ...this.conversations[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return { ...this.conversations[index] };
  }

  async deleteConversation(id) {
    await this.delay(300);
    const index = this.conversations.findIndex(c => c.Id === id);
    if (index === -1) {
      throw new Error('Conversation not found');
    }
    
    this.conversations.splice(index, 1);
    // Also remove associated messages
    this.messages = this.messages.filter(m => m.conversationId !== id);
    return true;
  }

  async getMessages(conversationId) {
    await this.delay(200);
    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  async createMessage(conversationId, data) {
    await this.delay(300);
    const conversation = this.conversations.find(c => c.Id === conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const newMessage = {
      Id: this.nextMessageId++,
      conversationId: conversationId,
      text: data.text,
      sender: data.sender || 'customer',
      orderContext: data.orderContext || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.messages.push(newMessage);

    // Update conversation last message
    await this.updateConversation(conversationId, {
      lastMessage: data.text,
      lastMessageAt: new Date().toISOString()
    });

    return { ...newMessage };
  }

  async updateMessage(id, data) {
    await this.delay(300);
    const index = this.messages.findIndex(m => m.Id === id);
    if (index === -1) {
      throw new Error('Message not found');
    }
    
    this.messages[index] = {
      ...this.messages[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return { ...this.messages[index] };
  }

  async deleteMessage(id) {
    await this.delay(300);
    const index = this.messages.findIndex(m => m.Id === id);
    if (index === -1) {
      throw new Error('Message not found');
    }
    
    this.messages.splice(index, 1);
    return true;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const chatService = new ChatService();