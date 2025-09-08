import { Kafka } from 'kafkajs';

class KafkaConsumerService {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'electric-dashboard',
      brokers: ['git restore --staged']
    });

    this.consumer = this.kafka.consumer({ 
      groupId: 'dashboard-group'
    });

    this.topic = 'dashboard-data';
  }

  async connect() {
    try {
      await this.consumer.connect();
      console.log('Kafka consumer connected');
    } catch (error) {
      console.error('Error connecting consumer:', error);
    }
  }

  async subscribe(onDataReceived) {
    try {
      await this.consumer.subscribe({ topic: this.topic });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const data = JSON.parse(message.value.toString());
          onDataReceived(data.type, data.value);
        }
      });
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  async disconnect() {
    try {
      await this.consumer.disconnect();
      console.log('Kafka consumer disconnected');
    } catch (error) {
      console.error('Error disconnecting consumer:', error);
    }
  }
}

export const kafkaConsumer = new KafkaConsumerService();