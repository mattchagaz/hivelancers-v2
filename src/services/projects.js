import { api } from './api';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
};

export const listPublicProjects = async (params = {}) => {
  try {
    const { data } = await api.get('/projects', { params });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar os projetos.'));
  }
};

export const getPublicProject = async (id) => {
  try {
    const { data } = await api.get(`/projects/${id}`);
    return data.project;
  } catch (error) {
    throw new Error(extractMessage(error, 'Projeto não encontrado.'));
  }
};

export const createProject = async (payload) => {
  try {
    const { data } = await api.post('/projects', payload);
    return data.project;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível publicar o projeto.'));
  }
};

export const listMyProjects = async (params = {}) => {
  try {
    const { data } = await api.get('/projects/mine', { params });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar seus projetos.'));
  }
};

export const getMyProject = async (id) => {
  try {
    const { data } = await api.get(`/projects/mine/${id}`);
    return data.project;
  } catch (error) {
    throw new Error(extractMessage(error, 'Projeto não encontrado.'));
  }
};

export const updateProject = async (id, payload) => {
  try {
    const { data } = await api.patch(`/projects/${id}`, payload);
    return data.project;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível atualizar o projeto.'));
  }
};

export const createProjectProposal = async (projectId, payload) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/proposals`, payload);
    return data.proposal;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível enviar a proposta.'));
  }
};

export const listProjectProposals = async (projectId) => {
  try {
    const { data } = await api.get(`/projects/${projectId}/proposals`);
    return data.proposals;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar as propostas.'));
  }
};

export const updateProjectProposalStatus = async (projectId, proposalId, status) => {
  try {
    const { data } = await api.patch(`/projects/${projectId}/proposals/${proposalId}`, { status });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível atualizar a proposta.'));
  }
};
