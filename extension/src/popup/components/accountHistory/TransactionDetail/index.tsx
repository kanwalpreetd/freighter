import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Identicon } from "@stellar/design-system";
import StellarSdk from "stellar-sdk";

import { PopupWrapper } from "popup/basics/PopupWrapper";

import { SubviewHeader } from "popup/components/SubviewHeader";

import { emitMetric } from "helpers/metrics";
import { openTab } from "popup/helpers/navigate";
import { stroopToXlm } from "helpers/stellar";
import { getIconUrlFromIssuer } from "@shared/api/helpers/getIconUrlFromIssuer";

import { settingsNetworkDetailsSelector } from "popup/ducks/settings";

import { METRIC_NAMES } from "popup/constants/metricsNames";

import { HorizonOperation } from "@shared/api/types";
import StellarLogo from "popup/assets/stellar-logo.png";

import "./styles.scss";

export interface TransactionDetailProps {
  operation: HorizonOperation;
  headerTitle: string;
  isRecipient: boolean;
  operationText: string;
  externalUrl: string;
  setIsDetailViewShowing: (isDetailViewShoing: boolean) => void;
}

export const TransactionDetail = ({
  operation,
  headerTitle,
  isRecipient,
  operationText,
  externalUrl,
  setIsDetailViewShowing,
}: TransactionDetailProps) => {
  const {
    asset_code: assetCode,
    asset_issuer: assetIssuer,
    asset_type: assetType,
    from,
    created_at: createdAt,
    transaction_attr: { fee_charged: feeCharged, memo },
  } = operation;
  const createdAtDateInstance = new Date(Date.parse(createdAt));
  const createdAtLocalStrArr = createdAtDateInstance
    .toLocaleString()
    .split(" ");
  const createdAtTime = `${createdAtLocalStrArr[1]
    .split(":")
    .slice(0, 2)
    .join(":")} ${createdAtLocalStrArr[2]}`;
  const createdAtDateStr = createdAtDateInstance
    .toDateString()
    .split(" ")
    .slice(1)
    .join(" ");

  const networkDetails = useSelector(settingsNetworkDetailsSelector);
  const [networkIconUrl, setNetworkIconUrl] = useState("");
  const [networkDomain, setNetworkDomain] = useState("");

  useEffect(() => {
    const fetchIconUrl = async () => {
      const { networkUrl } = networkDetails;
      const server = new StellarSdk.Server(networkUrl);
      let iconUrl = "";
      let assetDomain = "";

      // TODO: Combine these 2 into 1 call. getIconUrlFromIssuer load's the issuer account from Horizon.
      // Find a way to get the icon and the home domain in one call even when icon is cached
      try {
        ({ home_domain: assetDomain } = await server.loadAccount(assetIssuer));
      } catch (e) {
        console.error(e);
      }
      setNetworkDomain(assetDomain || " ");

      try {
        iconUrl = await getIconUrlFromIssuer({
          key: assetIssuer || "",
          code: assetCode || "",
          networkDetails,
        });
      } catch (e) {
        console.error(e);
      }

      setNetworkIconUrl(iconUrl);
    };

    if (assetIssuer) {
      fetchIconUrl();
    }
  }, [assetCode, assetIssuer, isRecipient, networkDetails]);

  return assetIssuer && !networkDomain ? null : (
    <div className="TransactionDetail">
      <PopupWrapper>
        <div>
          <SubviewHeader
            customBackAction={() => setIsDetailViewShowing(false)}
            title={headerTitle}
          />
          <div className="TransactionDetail__header">
            {operationText}
            <div className="TransactionDetail__header__network">
              {networkIconUrl || assetType === "native" ? (
                <img src={networkIconUrl || StellarLogo} alt="Network icon" />
              ) : (
                <div className="TransactionDetail__header__network__icon" />
              )}

              {networkDomain || "Stellar Lumens"}
            </div>
          </div>
          <div className="TransactionDetail__info">
            {from ? (
              <div className="TransactionDetail__info__row">
                <div>From</div>
                <div>
                  <Identicon publicAddress={from} shortenAddress size="1rem" />
                </div>
              </div>
            ) : null}
            <div className="TransactionDetail__info__row">
              <div>Date</div>
              <div>
                {createdAtTime} &bull; {createdAtDateStr}
              </div>
            </div>
            <div className="TransactionDetail__info__row">
              <div>Memo</div>
              <div>{memo || `None`}</div>
            </div>
            <div className="TransactionDetail__info__row">
              <div>Fee</div>
              <div>{stroopToXlm(feeCharged).toString()} XLM</div>
            </div>
          </div>
        </div>
      </PopupWrapper>
      <div className="TransactionDetail__external-button">
        <Button
          fullWidth
          onClick={() => {
            emitMetric(METRIC_NAMES.historyOpenItem);
            openTab(externalUrl);
          }}
          variant={Button.variant.tertiary}
        >
          View on stellar.expert
        </Button>
      </div>
    </div>
  );
};