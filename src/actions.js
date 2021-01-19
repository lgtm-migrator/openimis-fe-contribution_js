import {
    graphql,
    formatPageQuery,
    formatPageQueryWithCount,
    formatMutation,
    formatJsonField,
    formatGQLString,
} from "@openimis/fe-core";
import _ from "lodash";
import _uuid from "lodash-uuid";


const POLICY_SUMMARY_PROJECTION = mm => [
  "uuid",
  `product{${mm.getRef("product.ProductPicker.projection")}}`,
  `officer{${mm.getRef("policy.PolicyOfficerPicker.projection")}}`,
  `family{${mm.getRef("insuree.FamilyPicker.projection").concat([`location{${mm.getRef("location.Location.FlatProjection")}}`])}}`,
  "enrollDate", "effectiveDate", "startDate", "expiryDate",
  "stage", "status",
  "value",
  "validityFrom", "validityTo"
]

const CONTRIBUTION_FULL_PROJECTION = mm => [
  "id",
  "uuid",
  "payDate",
  "amount",
  "payType",
  "receipt",
  "isPhotoFee",
  "clientMutationId",
  `payer${mm.getProjection("payer.PayerPicker.projection")}`,
  `policy{${POLICY_SUMMARY_PROJECTION(mm).join(",")}}`,
];

export function fetchPoliciesPremiums(mm, filters) {
    let payload = formatPageQueryWithCount("premiumsByPolicies",
        filters,
        [
            "id", "uuid", "payDate",
            `payer${mm.getProjection("payer.PayerPicker.projection")}`,
            "amount", "payType", "receipt", "isPhotoFee"]
    );
    return graphql(payload, 'CONTRIBUTION_POLICES_PREMIUMS');
}

export function fetchContributionsSummaries(mm, filters) {
    let projections = [
      "id",
      "uuid",
      "payDate",
      "amount",
      "payType",
      "receipt",
      "isPhotoFee",
      "clientMutationId",
      `payer${mm.getProjection("payer.PayerPicker.projection")}`,
    ];
    const payload = formatPageQueryWithCount("premiums",
      filters,
      projections
    );
    return graphql(payload, 'CONTRIBUTION_CONTRIBUTIONS');
  }


export function selectPremium(premium) {
    return dispatch => {
      dispatch({ type: 'CONTRIBUTION_PREMIUM', payload: premium })
    }
  }

export function formatContributionGQL(mm, contribution) {
  const req = `
    ${contribution.uuid !== undefined && contribution.uuid !== null ? `uuid: "${contribution.uuid}"` : ''}
    ${!!contribution.receipt ? `receipt: "${formatGQLString(contribution.receipt)}"` : ""}
    ${!!contribution.payDate ? `payDate: "${contribution.payDate}"` : ""}
    ${!!contribution.payType ? `payType: "${contribution.payType}"` : ""}
    ${`isPhotoFee: ${contribution.isPhotoFee}`}
    ${!!contribution.amount ? `amount: "${contribution.amount}"` : ""}
    ${!!contribution.payer ? `payerUuid: "${contribution.payer.uuid}"` : ""}
    ${!!contribution.jsonExt ? `jsonExt: ${formatJsonField(contribution.jsonExt)}` : ""}
    ${!!contribution.policy ? `policyUuid: "${formatGQLString(contribution.policy.uuid)}"` : ""}
  `
  return req;
}

export function fetchContribution(mm, contributionUuid) {
  let filters = []
  if (!!contributionUuid) {
    filters.push(`uuid: "${contributionUuid}"`)
  }
  const payload = formatPageQuery("premiums",
    filters,
    CONTRIBUTION_FULL_PROJECTION(mm)
  );
  return graphql(payload, 'CONTRIBUTION_OVERVIEW');
}

export function newContribution() {
  return dispatch => {
    dispatch({ type: 'CONTRIBUTION_NEW' })
  }
}

export function createContribution(mm, contribution, clientMutationLabel) {
  let mutation = formatMutation("createPremium", formatContributionGQL(mm, contribution), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ['CONTRIBUTION_MUTATION_REQ', 'CONTRIBUTION_CREATE_RESP', 'CONTRIBUTION_MUTATION_ERR'],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime
    }
  )
}

export function updateContribution(mm, contribution, clientMutationLabel) {
  let mutation = formatMutation("updatePremium", formatContributionGQL(mm, contribution), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ['CONTRIBUTION_MUTATION_REQ', 'CONTRIBUTION_UPDATE_RESP', 'CONTRIBUTION_MUTATION_ERR'],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      contributionUuid: contribution.uuid,
    }
  )
}


export function deleteContribution(mm, contribution, clientMutationLabel) {
  let mutation = formatMutation("deletePremium", `uuids: ["${contribution.uuid}"]`, clientMutationLabel);
  contribution.clientMutationId = mutation.clientMutationId;
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ['CONTRIBUTION_MUTATION_REQ', 'CONTRIBUTION_DELETE_RESP', 'CONTRIBUTION_MUTATION_ERR'],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      contributionUuid: contribution.uuid,
    }
  )
}
