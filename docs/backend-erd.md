::: mermaid
erDiagram
    PROJECT_INPUT {
        Consortium consortium
        Project project
    }

    CONSORTIUM {
        BusinessId leadApplicantBusinessId
        BusinessId[] memberBusinessIds
    }

    PROJECT {
        number budget
        number requestedGrant
        string description
    }

    PROJECT_OUTPUT {
        Success success
        CompanyRiskRecord companyRisks
        string llmFeedback
    }

    SUCCESS {
        number successProbability "0-1"
        enum trafficLight "green | yellow | red"
    }

    COMPANY_RISK_RECORD {
        BusinessId businessId
        CompanyRisk companyRisk
    }

    COMPANY_RISK {
        enum financialRisk "low | medium | high "
        enum businessFinlandFundingHistory "none | low | medium | high "
    }

  BUSINESS_ID {
    string value "regex + check digit validation"
  }

    PROJECT_INPUT ||--|| CONSORTIUM : contains
    PROJECT_INPUT ||--|| PROJECT : contains
    CONSORTIUM ||--o{ BUSINESS_ID : contains
    PROJECT_OUTPUT ||--|| SUCCESS : contains
    PROJECT_OUTPUT ||--o{ COMPANY_RISK_RECORD : contains
    COMPANY_RISK_RECORD ||--|| COMPANY_RISK : value
    COMPANY_RISK_RECORD ||--|| BUSINESS_ID : key
