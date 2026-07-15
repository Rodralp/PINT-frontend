import apiClient from './apiClient';

export const teamService = {
  getAllTeams: async () => {
    const { data } = await apiClient.get('/teams');
    return data;
  },

  getTeamsWithExpiringSLA: async (days = 30) => {
    const { data } = await apiClient.get(`/teams/expiring?days=${days}`);
    return data;
  },

  getTeamById: async (id) => {
    const { data } = await apiClient.get(`/teams/${id}`);
    return data;
  },

  createTeam: async (teamData) => {
    const { data } = await apiClient.post('/teams', teamData);
    return data;
  },

  updateTeam: async (id, teamData) => {
    const { data } = await apiClient.put(`/teams/${id}`, teamData);
    return data;
  },

  deleteTeam: async (id) => {
    const { data } = await apiClient.delete(`/teams/${id}`);
    return data;
  },

  getAllUsers: async () => {
    const { data } = await apiClient.get('/teams/users');
    return data;
  },
};
