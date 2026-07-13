import apiClient from './apiClient';

export const teamService = {
  getAllTeams: async () => {
    try {
      const response = await apiClient.get('/teams');
      return response.data;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  getTeamsWithExpiringSLA: async (days = 30) => {
    try {
      const response = await apiClient.get(`/teams/expiring?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teams with expiring SLA:', error);
      throw error;
    }
  },

  getTeamById: async (id) => {
    try {
      const response = await apiClient.get(`/teams/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  },

  createTeam: async (teamData) => {
    try {
      const response = await apiClient.post('/teams', teamData);
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  updateTeam: async (id, teamData) => {
    try {
      const response = await apiClient.put(`/teams/${id}`, teamData);
      return response.data;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  deleteTeam: async (id) => {
    try {
      const response = await apiClient.delete(`/teams/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/teams/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
};
