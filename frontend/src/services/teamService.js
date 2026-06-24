import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://pint-backend-vwqc.onrender.com/api') + '/teams';

export const teamService = {
  // Get all teams
  getAllTeams: async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  // Get teams with expiring SLA
  getTeamsWithExpiringSLA: async (days = 30) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/expiring?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teams with expiring SLA:', error);
      throw error;
    }
  },

  // Get team by ID
  getTeamById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  },

  // Create new team
  createTeam: async (teamData) => {
    try {
      const response = await axios.post(API_BASE_URL, teamData);
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  // Update team
  updateTeam: async (id, teamData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}`, teamData);
      return response.data;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  // Delete team
  deleteTeam: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  // Get all users for team selection
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
};
