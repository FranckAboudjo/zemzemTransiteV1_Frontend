import API from "./axiosInstance";

export const API_PATHS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout", //logger un utilisateur et retourne un token jwt
    REGISTER: "/auth/adduser", // ajoute un utilisateur
    ME: "/auth/me",
    UPDATE_PASSWORD: "/auth/update-password",
  },

  STAT: {
    GET_ALL_STATS: "/dashboard/stats/",
  },

  USERS: {
    GET_ALL_USERS: "/users/all",
    GET_ONE_USER: "/users/:id",
    CREATE_USER: "/users",
    UPDATE_USER: "/users/:id",
    DELETE_USER: "/users/:id",
    RESET_PASSWORD: "/users/reset-password/:id",
    RESTRICT_USER: "/users/restrict/:id",
  },

  CLIENTS: {
    GET_ALL_CLIENTS: "/clients/",
    GET_ONE_CLIENT: "/clients/:id",
    CREATE_CLIENT: "/clients/",
    UPDATE_CLIENT: "/clients/:id",
    DELETE_CLIENT: "/clients/:id",
  },

  BLS: {
    GET_ALL_BL: "/bls/",
    GET_ONE_BL: "/bls/:id",
    GET_ALL_BL_BY_CLIENT: "/bls/client",
    CREATE_BL: "/bls/",
    UPDATE_BL: "/bls/:id",
    DELETE_BL: "/bls",
    ADD_NEW_CHARGE: "/bls/add-charge/:id_bl",
    GET_CREDIT_DOUANE: "/bls/liquidation",
  },

  PAIEMENTCHARGE: {
    CREATE_PAIEMENT_CHARGE: "/paiements/:id_bl", // id du BL
    UPDATE_PAIEMENT_CHARGE: "/paiements/:id_bl", //id du paiement
    DELETE_PAIEMENT_CHARGE: "/paiements/:id_bl/:id_charge", //id du paiement
  },

  INITIALISATION: {
    CHECK_INIT: "/init-company/status",
    INIT: "/init-company/init",
    UPDATE: "/init-company/update",
    RESET: "/init-company/reset",
    LOGO: "/logo/",
  },

  VALIDERBL: {
    CREATE_VALIDERBL: "/valide-bl/:id_bl",
    UPDATE_VALIDERBL: "/valide-bl/:id_bl",
    DELETE_VALIDERBL: "/valide-bl/:id_bl",
  },

  HISTORIQUE: {
    ALL_CLIENT: "/historique/clients",
    CLIENTS_BY_ID: "/historique/clients/:id_client",
    ALL_AGENT: "/historique/agents",
    AGENTS_BY_ID: "/historique/agents/:id_agent",
    CAISSE: "/historique/caisse",
    CAPITAL: "/historique/capital",
    DOUANE: "/historique/douane",
  },

  FACTURATION: {
    CREATE_FACTURATION: "/facturation/",
    GET_ALL_FACTURATION: "/facturation/",
    GET_ONE_FACTURATION: "/facturation/:id", //id de la facture
    GET_ALL_FACTURATION_BY_CLIENT: "/facturation/client/:id_client", //id du client
    UPDATE_FACTURATION: "/facturation/:id", //id de la facture
    DELETE_FACTURATION: "/facturation/:id", //id de la facture
  },

  VERSEMENTCLIENT: {
    CREATE_VERSEMENT_CLIENT: "/versements-client/add/:idUser",
    GET_ALL_VERSEMENT_CLIENT: "/versements-client/",
    GET_ONE_VERSEMENT_CLIENT: "/versements-client/:id", //id du versement
    UPDATE_VERSEMENT_CLIENT: "/versements-client/:id", //id du client
    DELETE_VERSEMENT_CLIENT: "/versements-client/:id", //id du versement
  },

  VERSEMENTAGENT: {
    ADD_VERSEMENT_AGENT: "/versements-agent/",
    ADD_RETAIT_AGENT: "/versements-agent/retrait/",
    GET_ALL_VERSEMENT_AGENT: "/versements-agent/",
    GET_ONE_VERSEMENT_AGENT: "/versements-agent/:id", //id du versement
    UPDATE_VERSEMENT_AGENT: "/versements-agent/:id", //id du client
    DELETE_VERSEMENT_AGENT: "/versements-agent/:id", //id du versement
  },

  GETINFO: {
    GET_INFO_SUMMARY: "/get-info/summary",
    GET_INFO_CAISSE: "/get-info/cash-office",
    GET_INFO_CREDIT: "/get-info/customs-credit",
    GET_INFO_CAPITAL: "/get-info/company-capital",
    GET_INFO_CLIENTS: "/get-info/clients-total",
    GET_INFO_AGENTS: "/get-info/agents-total",
  },

  RECHARGE: {
    CREATE_RECHARGE: "/recharge-caisse/",
    GET_ALL_RECHARGE: "/recharge-caisse/",
    GET_ONE_RECHARGE: "/recharge-caisse/:id", //id de la recharge
    UPDATE_RECHARGE: "/recharge-caisse/:id", //id de la recharge
    DELETE_RECHARGE: "/recharge-caisse/:id", //id de la recharge
  },

  REMBOURSEMENTDOUANE: {
    CREATE_REMBOURSEMENT_DOUANE: "/remboursement-douane/",
    GET_ALL_REMBOURSEMENT_DOUANE: "/remboursement-douane/",
    GET_ONE_REMBOURSEMENT_DOUANE: "/remboursement-douane/:id", //id du remboursement douane
    UPDATE_REMBOURSEMENT_DOUANE: "/remboursement-douane/:id", //id du remboursement douane
    DELETE_REMBOURSEMENT_DOUANE: "/remboursement-douane/:id", //id du remboursement douane
    RESET_CREDIT_DOUANE: "/remboursement-douane/reset/",
  },

  ARCHIVES: {
    GET_ITEMS: "/archives/",
    CREATE_FOLDER: "/archives/folder",
    DELETE_FOLDER: "/archives/folder",
    DELETE_FILE: "/archives/file",
    UPDATE_FILE: "/archives/file",
    DOWNLOAD_FILE: "/archives/file/download",
    DOWNLOAD_FOLDER: "/archives/folder/download",
    RENAME_FOLDER: "/archives/folder/rename",
    RENAME_FILE: "/archives/file/rename",
  },

  FACTURE: {
    CREATE_FACTURE: "/factures/",
    GET_ALL_FACTURE: "/factures/",
    GET_ONE_FACTURE: "/factures/:id", //id de la facture
    UPDATE_FACTURE: "/factures/:id", //id de la facture
    DELETE_FACTURE: "/factures/:id", //id de la facture
  },

  LIQUIDATION: {
    PAYER_LIQUIDATION: "/liquidations/rembourser/:id_bl/:id_charge",
    GET_ALL_LIQUIDATION_DOUANE: "/liquidations/list/credit-douane",
    GET_ONE_LIQUIDATION_ESPECES: "/liquidations/list/regulees", //id de la liquidation
    GET_ALL_LIQUIDATION: "/liquidations/", //id de la liquidation
    ANNULER_LIQUIDATION: "/liquidations/annuler/:id_bl/:id_charge", //id de la liquidation
  },
};
