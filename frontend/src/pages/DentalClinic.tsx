import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Modal, Form, Input, DatePicker, Select } from 'antd';
import { PlusOutlined, CalendarOutlined, UserOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  lastVisit?: string;
  status: 'active' | 'inactive';
}

interface Appointment {
  id: string;
  appointmentId: string;
  patientName: string;
  appointmentDate: string;
  appointmentType: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  doctorName: string;
}

const DentalClinic: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Mock data for demonstration
  useEffect(() => {
    setPatients([
      {
        id: '1',
        patientId: 'PAT-001',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+91 98765 43210',
        email: 'john.doe@email.com',
        lastVisit: '2024-01-15',
        status: 'active'
      },
      {
        id: '2',
        patientId: 'PAT-002',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+91 98765 43211',
        email: 'jane.smith@email.com',
        lastVisit: '2024-01-10',
        status: 'active'
      }
    ]);

    setAppointments([
      {
        id: '1',
        appointmentId: 'APT-001',
        patientName: 'John Doe',
        appointmentDate: '2024-01-20 10:00',
        appointmentType: 'Consultation',
        status: 'scheduled',
        doctorName: 'Dr. Sarah Johnson'
      },
      {
        id: '2',
        appointmentId: 'APT-002',
        patientName: 'Jane Smith',
        appointmentDate: '2024-01-20 14:00',
        appointmentType: 'Cleaning',
        status: 'confirmed',
        doctorName: 'Dr. Michael Chen'
      }
    ]);
  }, []);

  const patientColumns: ColumnsType<Patient> = [
    {
      title: 'Patient ID',
      dataIndex: 'patientId',
      key: 'patientId',
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Last Visit',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'active' ? 'success' : 'default'} 
          text={status} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewPatient(record)}>
          View
        </Button>
      ),
    },
  ];

  const appointmentColumns: ColumnsType<Appointment> = [
    {
      title: 'Appointment ID',
      dataIndex: 'appointmentId',
      key: 'appointmentId',
    },
    {
      title: 'Patient',
      dataIndex: 'patientName',
      key: 'patientName',
    },
    {
      title: 'Date & Time',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
    },
    {
      title: 'Type',
      dataIndex: 'appointmentType',
      key: 'appointmentType',
    },
    {
      title: 'Doctor',
      dataIndex: 'doctorName',
      key: 'doctorName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          scheduled: { color: 'blue', text: 'Scheduled' },
          confirmed: { color: 'green', text: 'Confirmed' },
          completed: { color: 'default', text: 'Completed' },
          cancelled: { color: 'red', text: 'Cancelled' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge color={config.color} text={config.text} />;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewAppointment(record)}>
          View
        </Button>
      ),
    },
  ];

  const handleViewPatient = (patient: Patient) => {
    console.log('View patient:', patient);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    console.log('View appointment:', appointment);
  };

  const handleAddPatient = () => {
    setPatientModalVisible(true);
  };

  const handleAddAppointment = () => {
    setAppointmentModalVisible(true);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: '#1890ff' }}>
          <MedicineBoxOutlined style={{ marginRight: '8px' }} />
          Dental Clinic Management
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>
              <UserOutlined style={{ marginRight: '8px' }} />
              Patients ({patients.length})
            </h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPatient}>
              Add Patient
            </Button>
          </div>
          <Table 
            columns={patientColumns} 
            dataSource={patients} 
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>
              <CalendarOutlined style={{ marginRight: '8px' }} />
              Today's Appointments ({appointments.length})
            </h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAppointment}>
              Add Appointment
            </Button>
          </div>
          <Table 
            columns={appointmentColumns} 
            dataSource={appointments} 
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      </div>

      {/* Add Patient Modal */}
      <Modal
        title="Add New Patient"
        open={patientModalVisible}
        onCancel={() => setPatientModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Patient
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Appointment Modal */}
      <Modal
        title="Add New Appointment"
        open={appointmentModalVisible}
        onCancel={() => setAppointmentModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Patient" name="patientId" rules={[{ required: true }]}>
            <Select placeholder="Select patient">
              {patients.map(patient => (
                <Option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Appointment Type" name="appointmentType" rules={[{ required: true }]}>
            <Select placeholder="Select appointment type">
              <Option value="consultation">Consultation</Option>
              <Option value="cleaning">Cleaning</Option>
              <Option value="treatment">Treatment</Option>
              <Option value="followup">Follow-up</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Date & Time" name="appointmentDateTime" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Appointment
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DentalClinic;
