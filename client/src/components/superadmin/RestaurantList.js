import React from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Typography
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';

const RestaurantList = ({ restaurants, onEdit, onDelete, onAdd }) => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Restaurants</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAdd}
        >
          Add Restaurant
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Restaurant</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Revenue</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {restaurants.map((restaurant) => (
              <TableRow key={restaurant.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2 }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">{restaurant.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        ID: {restaurant.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{restaurant.phone}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {restaurant.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{restaurant.address}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {restaurant.city}, {restaurant.state}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={restaurant.type} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={restaurant.status}
                    color={restaurant.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    ₹{restaurant.monthlyRevenue?.toLocaleString() || '0'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEdit(restaurant)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(restaurant.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RestaurantList;
