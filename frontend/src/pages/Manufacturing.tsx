import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Modal, Form, Input, DatePicker, Select, Progress } from 'antd';
import { PlusOutlined, ToolOutlined, ShoppingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface BOM {
  id: string;
  bomId: string;
  name: string;
  productName: string;
  version: string;
  status: 'draft' | 'approved' | 'active' | 'obsolete';
  totalCost: number;
  components: number;
}

interface ProductionOrder {
  id: string;
  productionOrderId: string;
  productName: string;
  quantityToProduce: number;
  quantityProduced: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  plannedStartDate: string;
  plannedEndDate: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const Manufacturing: React.FC = () => {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [bomModalVisible, setBomModalVisible] = useState(false);
  const [productionOrderModalVisible, setProductionOrderModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Mock data for demonstration
  useEffect(() => {
    setBoms([
      {
        id: '1',
        bomId: 'BOM-001',
        name: 'Steel Chair Assembly',
        productName: 'Office Chair',
        version: '1.0',
        status: 'active',
        totalCost: 2500.00,
        components: 15
      },
      {
        id: '2',
        bomId: 'BOM-002',
        name: 'Wooden Table Assembly',
        productName: 'Dining Table',
        version: '2.1',
        status: 'approved',
        totalCost: 1800.00,
        components: 12
      }
    ]);

    setProductionOrders([
      {
        id: '1',
        productionOrderId: 'PO-001',
        productName: 'Office Chair',
        quantityToProduce: 50,
        quantityProduced: 35,
        status: 'in_progress',
        plannedStartDate: '2024-01-15',
        plannedEndDate: '2024-01-25',
        priority: 'high'
      },
      {
        id: '2',
        productionOrderId: 'PO-002',
        productName: 'Dining Table',
        quantityToProduce: 20,
        quantityProduced: 0,
        status: 'planned',
        plannedStartDate: '2024-01-20',
        plannedEndDate: '2024-01-30',
        priority: 'normal'
      }
    ]);
  }, []);

  const bomColumns: ColumnsType<BOM> = [
    {
      title: 'BOM ID',
      dataIndex: 'bomId',
      key: 'bomId',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Components',
      dataIndex: 'components',
      key: 'components',
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost) => `₹${cost.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          draft: { color: 'default', text: 'Draft' },
          approved: { color: 'green', text: 'Approved' },
          active: { color: 'blue', text: 'Active' },
          obsolete: { color: 'red', text: 'Obsolete' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge color={config.color} text={config.text} />;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewBOM(record)}>
          View
        </Button>
      ),
    },
  ];

  const productionOrderColumns: ColumnsType<ProductionOrder> = [
    {
      title: 'PO ID',
      dataIndex: 'productionOrderId',
      key: 'productionOrderId',
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = (record.quantityProduced / record.quantityToProduce) * 100;
        return (
          <div>
            <Progress 
              percent={Math.round(progress)} 
              size="small" 
              status={record.status === 'completed' ? 'success' : 'active'}
            />
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.quantityProduced}/{record.quantityToProduce}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          planned: { color: 'blue', text: 'Planned' },
          in_progress: { color: 'processing', text: 'In Progress' },
          completed: { color: 'success', text: 'Completed' },
          cancelled: { color: 'error', text: 'Cancelled' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge color={config.color} text={config.text} />;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const priorityConfig = {
          low: { color: 'default', text: 'Low' },
          normal: { color: 'blue', text: 'Normal' },
          high: { color: 'orange', text: 'High' },
          urgent: { color: 'red', text: 'Urgent' }
        };
        const config = priorityConfig[priority as keyof typeof priorityConfig];
        return <Badge color={config.color} text={config.text} />;
      },
    },
    {
      title: 'Planned End',
      dataIndex: 'plannedEndDate',
      key: 'plannedEndDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewProductionOrder(record)}>
          View
        </Button>
      ),
    },
  ];

  const handleViewBOM = (bom: BOM) => {
    console.log('View BOM:', bom);
  };

  const handleViewProductionOrder = (productionOrder: ProductionOrder) => {
    console.log('View Production Order:', productionOrder);
  };

  const handleAddBOM = () => {
    setBomModalVisible(true);
  };

  const handleAddProductionOrder = () => {
    setProductionOrderModalVisible(true);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: '#1890ff' }}>
          <ToolOutlined style={{ marginRight: '8px' }} />
          Manufacturing Management
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>
              <ShoppingOutlined style={{ marginRight: '8px' }} />
              Bill of Materials ({boms.length})
            </h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBOM}>
              Add BOM
            </Button>
          </div>
          <Table 
            columns={bomColumns} 
            dataSource={boms} 
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>
              <CheckCircleOutlined style={{ marginRight: '8px' }} />
              Production Orders ({productionOrders.length})
            </h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProductionOrder}>
              Add Production Order
            </Button>
          </div>
          <Table 
            columns={productionOrderColumns} 
            dataSource={productionOrders} 
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      </div>

      {/* Add BOM Modal */}
      <Modal
        title="Add New Bill of Materials"
        open={bomModalVisible}
        onCancel={() => setBomModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="BOM Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Product" name="productName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Version" name="version" rules={[{ required: true }]}>
            <Input defaultValue="1.0" />
          </Form.Item>
          <Form.Item label="BOM Type" name="bomType" rules={[{ required: true }]}>
            <Select placeholder="Select BOM type">
              <Option value="production">Production</Option>
              <Option value="engineering">Engineering</Option>
              <Option value="costing">Costing</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add BOM
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Production Order Modal */}
      <Modal
        title="Add New Production Order"
        open={productionOrderModalVisible}
        onCancel={() => setProductionOrderModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Product" name="productId" rules={[{ required: true }]}>
            <Select placeholder="Select product">
              {boms.map(bom => (
                <Option key={bom.id} value={bom.id}>
                  {bom.productName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Quantity to Produce" name="quantity" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
            <Select placeholder="Select priority">
              <Option value="low">Low</Option>
              <Option value="normal">Normal</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Planned Start Date" name="startDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Planned End Date" name="endDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Production Order
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Manufacturing;
