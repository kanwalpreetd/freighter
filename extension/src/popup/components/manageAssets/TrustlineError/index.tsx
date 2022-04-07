import React, { useEffect, useState } from "react";
import { InfoBlock } from "@stellar/design-system";
import { useHistory, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import BigNumber from "bignumber.js";

import { Button } from "popup/basics/buttons/Button";
import { transactionSubmissionSelector } from "popup/ducks/transactionSubmission";

import { getResultCode, RESULT_CODES } from "popup/helpers/parseTransaction";

import { Balances } from "@shared/api/types";

import "./styles.scss";

export enum TRUSTLINE_ERROR_STATES {
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  NOT_ENOUGH_LUMENS = "NOT_ENOUGH_LUMENS",
  ASSET_HAS_BALANCE = "ASSET_HAS_BALANCE",
}

const mapErrorToErrorState = (operations: string[]) => {
  if (operations.includes(RESULT_CODES.op_invalid_limit)) {
    return TRUSTLINE_ERROR_STATES.ASSET_HAS_BALANCE;
  }

  if (operations.includes(RESULT_CODES.op_low_reserve)) {
    return TRUSTLINE_ERROR_STATES.NOT_ENOUGH_LUMENS;
  }

  return TRUSTLINE_ERROR_STATES.UNKNOWN_ERROR;
};

const renderError = (
  errorState: TRUSTLINE_ERROR_STATES,
  assetBalance: string,
) => {
  switch (errorState) {
    case TRUSTLINE_ERROR_STATES.NOT_ENOUGH_LUMENS:
      return (
        <InfoBlock variant={InfoBlock.variant.error}>
          <p className="TrustlineError__title">Not enough lumens</p>
          <p>0.500001 XLM are required to add a new asset.</p>
          <p className="TrustlineError__links">
            <Link to="https://developers.stellar.org/docs/glossary/minimum-balance/#changes-to-transaction-fees-and-minimum-balances">
              Learn more about transaction fees
            </Link>
            <br />
            <Link to="https://developers.stellar.org/docs/glossary/accounts/#liabilities">
              Learn more about account reserves
            </Link>
          </p>
        </InfoBlock>
      );
    case TRUSTLINE_ERROR_STATES.ASSET_HAS_BALANCE:
      return (
        <>
          <InfoBlock variant={InfoBlock.variant.warning}>
            <p className="TrustlineError__title">This asset has a balance</p>
          </InfoBlock>
          <p className="TrustlineError__subtitle">
            This asset has a balance of <strong>{assetBalance}</strong>. You
            must have a balance of <strong>0</strong> in order to remove an
            asset.
          </p>
        </>
      );
    case TRUSTLINE_ERROR_STATES.UNKNOWN_ERROR:
    default:
      return (
        <InfoBlock variant={InfoBlock.variant.error}>
          <p className="TrustlineError__title">An unknown error occurred.</p>
        </InfoBlock>
      );
  }
};

interface TrustlineErrorProps {
  balances: Balances;
  errorAsset: string;
}

export const TrustlineError = ({
  balances,
  errorAsset,
}: TrustlineErrorProps) => {
  const history = useHistory();
  const { error } = useSelector(transactionSubmissionSelector);
  const [assetBalance, setAssetBalance] = useState("");

  useEffect(() => {
    if (!balances) return;
    const balance = balances[errorAsset];

    if (balance) {
      setAssetBalance(
        `${new BigNumber(balance.available).toString()} ${balance.token.code}`,
      );
    }
  }, [balances, errorAsset]);

  const errorState: TRUSTLINE_ERROR_STATES = error
    ? mapErrorToErrorState(getResultCode(error))
    : TRUSTLINE_ERROR_STATES.UNKNOWN_ERROR;

  return (
    <div className="TrustlineError">
      <div className="TrustlineError__body">
        {renderError(errorState, assetBalance)}
      </div>
      <div className="TrustlineError__button">
        <Button fullWidth onClick={() => history.goBack()}>
          Got it
        </Button>
      </div>
    </div>
  );
};