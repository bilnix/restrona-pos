import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Avatar,
  IconButton,
  Chip
} from '@mui/material';
import {
  Save,
  Restaurant,
  Schedule,
  LocationOn,
  Phone,
  Email,
  Edit,
  Upload,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const Settings = ({ restaurant, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    openingHours: {
      monday: { open: '09:00', close: '22:00', isOpen: true },
      tuesday: { open: '09:00', close: '22:00', isOpen: true },
      wednesday: { open: '09:00', close: '22:00', isOpen: true },
      thursday: { open: '09:00', close: '22:00', isOpen: true },
      friday: { open: '09:00', close: '23:00', isOpen: true },
      saturday: { open: '10:00', close: '23:00', isOpen: true },
      sunday: { open: '10:00', close: '22:00', isOpen: true }
    },
    settings: {
      autoAcceptOrders: false,
      requireTableReservation: false,
      allowWalkIns: true,
      maxTableReservationSize: 8,
      orderPreparationTime: 20,
      deliveryRadius: 5
    }
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        website: restaurant.website || '',
        openingHours: restaurant.openingHours || formData.openingHours,
        settings: restaurant.settings || formData.settings
      });
    }
  }, [restaurant]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleOpeningHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const restaurantRef = doc(db, 'restaurants', restaurant.id);
      await updateDoc(restaurantRef, {
        ...formData,
        updatedAt: new Date()
      });

      toast.success('Restaurant settings updated successfully!');
      if (onUpdate) {
        onUpdate(formData);
      }
    } catch (error) {
      console.error('Error updating restaurant settings:', error);
      toast.error('Failed to update restaurant settings');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Restaurant Settings
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Restaurant sx={{ mr: 1 }} />
                  Basic Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Restaurant Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourrestaurant.com"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Tell customers about your restaurant..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="123 Main St, City, State 12345"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Opening Hours */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 1 }} />
                  Opening Hours
                </Typography>
                
                <Grid container spacing={2}>
                  {daysOfWeek.map((day) => (
                    <Grid item xs={12} sm={6} md={4} key={day.key}>
                      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {day.label}
                          </Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.openingHours[day.key].isOpen}
                                onChange={(e) => handleOpeningHoursChange(day.key, 'isOpen', e.target.checked)}
                                size="small"
                              />
                            }
                            label=""
                          />
                        </Box>
                        
                        {formData.openingHours[day.key].isOpen && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              type="time"
                              value={formData.openingHours[day.key].open}
                              onChange={(e) => handleOpeningHoursChange(day.key, 'open', e.target.value)}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                              to
                            </Typography>
                            <TextField
                              type="time"
                              value={formData.openingHours[day.key].close}
                              onChange={(e) => handleOpeningHoursChange(day.key, 'close', e.target.value)}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                          </Box>
                        )}
                        
                        {!formData.openingHours[day.key].isOpen && (
                          <Chip label="Closed" color="error" size="small" />
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Restaurant Settings */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  Restaurant Settings
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.settings.autoAcceptOrders}
                          onChange={(e) => handleSettingsChange('autoAcceptOrders', e.target.checked)}
                        />
                      }
                      label="Auto-accept orders"
                    />
                    <Typography variant="body2" color="textSecondary">
                      Automatically accept incoming orders
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.settings.requireTableReservation}
                          onChange={(e) => handleSettingsChange('requireTableReservation', e.target.checked)}
                        />
                      }
                      label="Require table reservations"
                    />
                    <Typography variant="body2" color="textSecondary">
                      Customers must reserve tables in advance
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.settings.allowWalkIns}
                          onChange={(e) => handleSettingsChange('allowWalkIns', e.target.checked)}
                        />
                      }
                      label="Allow walk-ins"
                    />
                    <Typography variant="body2" color="textSecondary">
                      Accept customers without reservations
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Max table reservation size"
                      type="number"
                      value={formData.settings.maxTableReservationSize}
                      onChange={(e) => handleSettingsChange('maxTableReservationSize', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 20 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Order preparation time (minutes)"
                      type="number"
                      value={formData.settings.orderPreparationTime}
                      onChange={(e) => handleSettingsChange('orderPreparationTime', parseInt(e.target.value))}
                      inputProps={{ min: 5, max: 120 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Delivery radius (miles)"
                      type="number"
                      value={formData.settings.deliveryRadius}
                      onChange={(e) => handleSettingsChange('deliveryRadius', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 50 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                loading={loading}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default Settings;
