import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar
} from '@mui/material';
import { Add, Edit, Delete, Save, Cancel, Person } from '@mui/icons-material';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const StaffManagement = ({ restaurantId }) => {
  const [staff, setStaff] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'waiter',
    status: 'active',
    salary: '',
    joinDate: '',
    address: ''
  });

  useEffect(() => {
    if (restaurantId) {
      fetchStaff();
    }
  }, [restaurantId]);

  const fetchStaff = async () => {
    try {
      const q = query(collection(db, 'users'), where('restaurantId', '==', restaurantId));
      const querySnapshot = await getDocs(q);
      const staffData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to fetch staff');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'users', editingStaff.id), {
          ...formData,
          salary: parseFloat(formData.salary),
          updatedAt: new Date()
        });
        toast.success('Staff member updated successfully');
      } else {
        await addDoc(collection(db, 'users'), {
          ...formData,
          restaurantId,
          salary: parseFloat(formData.salary),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('Staff member added successfully');
      }
      setOpenDialog(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff member:', error);
      toast.error('Failed to save staff member');
    }
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteDoc(doc(db, 'users', staffId));
        toast.success('Staff member deleted successfully');
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff member:', error);
        toast.error('Failed to delete staff member');
      }
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      role: staffMember.role || 'waiter',
      status: staffMember.status || 'active',
      salary: staffMember.salary?.toString() || '',
      joinDate: staffMember.joinDate || '',
      address: staffMember.address || ''
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'waiter',
      status: 'active',
      salary: '',
      joinDate: '',
      address: ''
    });
    setEditingStaff(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager':
        return 'error';
      case 'chef':
        return 'warning';
      case 'waiter':
        return 'info';
      case 'cashier':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Staff Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add Staff Member
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Staff Member</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Salary</TableCell>
              <TableCell>Join Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((staffMember) => (
              <TableRow key={staffMember.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2 }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{staffMember.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {staffMember.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{staffMember.phone}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {staffMember.address}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={staffMember.role}
                    color={getRoleColor(staffMember.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={staffMember.status}
                    color={getStatusColor(staffMember.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>₹{staffMember.salary}</TableCell>
                <TableCell>{staffMember.joinDate}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(staffMember)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(staffMember.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    label="Role"
                  >
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="chef">Chef</MenuItem>
                    <MenuItem value="waiter">Waiter</MenuItem>
                    <MenuItem value="cashier">Cashier</MenuItem>
                    <MenuItem value="kitchen_staff">Kitchen Staff</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="on_leave">On Leave</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Join Date"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              <Cancel /> Cancel
            </Button>
            <Button type="submit" variant="contained">
              <Save /> {editingStaff ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;
