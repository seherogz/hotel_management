import React, { useState, useEffect } from 'react';
import { Modal, Button, List, Form, Input, DatePicker, Space, Tag, Empty, Spin, Typography, notification } from 'antd';
import { ToolOutlined, CheckCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/tr';
import roomService from '../../services/roomService';

const { TextArea } = Input;
const { Title, Text } = Typography;

const MaintenanceIssues = ({ visible, onClose, room }) => {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [addFormVisible, setAddFormVisible] = useState(false);
  const [addForm] = Form.useForm();

  useEffect(() => {
    if (visible && room) {
      fetchMaintenanceIssues();
    }
  }, [visible, room]);

  const fetchMaintenanceIssues = async () => {
    if (!room || !room.id) return;
    
    setLoading(true);
    try {
      const response = await roomService.getRoomMaintenanceIssues(room.id);
      setIssues(Array.isArray(response) ? response : []);
      console.log('Maintenance issues loaded:', response);
    } catch (error) {
      console.error('Error loading maintenance issues:', error);
      notification.error({
        message: 'Error',
        description: 'An error occurred while loading maintenance issues.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIssue = () => {
    setAddFormVisible(true);
    addForm.resetFields();
  };

  const handleAddFormCancel = () => {
    setAddFormVisible(false);
  };

  const handleAddFormSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      
      const issueData = {
        issueDescription: values.issueDescription,
        estimatedCompletionDate: values.estimatedCompletionDate.toISOString()
      };

      setLoading(true);
      await roomService.addMaintenanceIssue(room.id, issueData);
      
      notification.success({
        message: 'Success',
        description: 'Maintenance issue added successfully.',
      });
      
      setAddFormVisible(false);
      fetchMaintenanceIssues();
    } catch (error) {
      console.error('Error adding maintenance issue:', error);
      notification.error({
        message: 'Error',
        description: 'An error occurred while adding the maintenance issue.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issueId) => {
    if (window.confirm('Are you sure you want to mark this issue as resolved?')) {
      setLoading(true);
      try {
        await roomService.resolveMaintenanceIssue(room.id, issueId);
        
        notification.success({
          message: 'Success',
          description: 'Maintenance issue marked as resolved successfully.',
        });
        
        fetchMaintenanceIssues();
      } catch (error) {
        console.error('Error resolving maintenance issue:', error);
        notification.error({
          message: 'Error',
          description: 'An error occurred while resolving the maintenance issue.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusTag = (status, resolvedDate) => {
    if (status?.toLowerCase() === 'resolved' || resolvedDate) {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Resolved</Tag>;
    }
    return <Tag color="processing" icon={<ToolOutlined />}>In Progress</Tag>;
  };

  return (
    <>
      <Modal
        title={<span style={{ color: '#3f2b7b' }}>{`Room ${room?.roomNumber} - Maintenance Issues`}</span>}
        visible={visible}
        onCancel={onClose}
        width={700}
        footer={[
          <Button key="back" onClick={onClose}>
            Close
          </Button>,
          <Button 
            key="add" 
            type="primary" 
            icon={<ToolOutlined />} 
            onClick={handleAddIssue}
            style={{ backgroundColor: '#3f2b7b', borderColor: '#3f2b7b' }}
          >
            Add Maintenance Issue
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          {issues.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={issues}
              renderItem={(issue) => (
                <List.Item
                  actions={
                    !issue.resolvedDate ? [
                      <Button 
                        key="resolve" 
                        type="primary" 
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleResolveIssue(issue.id)}
                        style={{ backgroundColor: '#3f2b7b', borderColor: '#3f2b7b' }}
                      >
                        Mark as Resolved
                      </Button>
                    ] : []
                  }
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong style={{ color: '#3f2b7b' }}>{issue.issueDescription || issue.description}</Text>
                        {getStatusTag(issue.status, issue.resolvedDate)}
                      </Space>
                    }
                    description={
                      <Space direction="vertical">
                        <Text>Report Date: {moment(issue.reportedDate).format('DD MMMM YYYY')}</Text>
                        {issue.estimatedCompletionDate && (
                          <Text>Estimated Completion: {moment(issue.estimatedCompletionDate).format('DD MMMM YYYY')}</Text>
                        )}
                        {issue.resolvedDate && (
                          <Text>Resolution Date: {moment(issue.resolvedDate).format('DD MMMM YYYY')}</Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty 
              description="No maintenance issues found for this room" 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
            />
          )}
        </Spin>
      </Modal>

      <Modal
        title={<span style={{ color: '#3f2b7b' }}>Add Maintenance Issue</span>}
        visible={addFormVisible}
        onCancel={handleAddFormCancel}
        onOk={handleAddFormSubmit}
        okText="Add"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: '#3f2b7b', borderColor: '#3f2b7b' } }}
      >
        <Form
          form={addForm}
          layout="vertical"
        >
          <Form.Item
            name="issueDescription"
            label="Issue Description"
            rules={[{ required: true, message: 'Please enter an issue description!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="estimatedCompletionDate"
            label="Estimated Completion Date"
            rules={[{ required: true, message: 'Please select an estimated completion date!' }]}
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              placeholder="Select date"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MaintenanceIssues; 