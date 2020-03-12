pragma solidity >=0.5.0 <0.7.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

/// @title RequestMultiSigIdentity - Manages a set of request identity and a threshold to perform actions on request network
/// @author Stefan George - <vrolland@request.network>
/// fork from https://github.com/gnosis/safe-contracts/blob/development/contracts/base/OwnerManager.sol#8e277ab
contract RequestMultiSigIdentity is Ownable {
    event AddedRequestIdentity(address requestIdentity);
    event RemovedRequestIdentity(address requestIdentity);
    event ChangedThreshold(uint256 threshold);

    address internal constant SENTINEL_IDENTITIES = address(0x1);

    mapping(address => address) internal requestIdentities;
    uint256 requestIdentityCount;
    uint256 internal threshold;
    bool internal allowParentIdentities;

    /// @dev Setup function sets initial storage of contract.
    /// @param _requestIdentities List of Safe requestIdentities.
    /// @param _threshold Number of required confirmations for a Safe transaction.
    constructor(
        address[] memory _requestIdentities,
        uint256 _threshold,
        bool _allowParentIdentities
    ) public {
        // Validate that threshold is smaller than number of added requestIdentities.
        require(
            _threshold <= _requestIdentities.length,
            'Threshold cannot exceed requestIdentity count'
        );
        // There has to be at least one Safe requestIdentity.
        require(_threshold >= 1, 'Threshold needs to be greater than 0');
        // Initializing Safe requestIdentities.
        address currentRequestIdentity = SENTINEL_IDENTITIES;
        for (uint256 i = 0; i < _requestIdentities.length; i++) {
            // RequestIdentity address cannot be null.
            address requestIdentity = _requestIdentities[i];
            require(
                requestIdentity != address(0) && requestIdentity != SENTINEL_IDENTITIES,
                'Invalid requestIdentity address provided'
            );
            // No duplicate requestIdentities allowed.
            require(
                requestIdentities[requestIdentity] == address(0),
                'Duplicate requestIdentity address provided'
            );
            requestIdentities[currentRequestIdentity] = requestIdentity;
            currentRequestIdentity = requestIdentity;
        }
        requestIdentities[currentRequestIdentity] = SENTINEL_IDENTITIES;
        requestIdentityCount = _requestIdentities.length;
        threshold = _threshold;
        allowParentIdentities = _allowParentIdentities;
    }

    /// @dev Allows to add a new requestIdentity to the Safe and update the threshold at the same time.
    ///      This can only be done by the owner.
    /// @param requestIdentity New requestIdentity address.
    /// @param _threshold New threshold.
    function addRequestIdentityWithThreshold(address requestIdentity, uint256 _threshold)
        public
        onlyOwner
    {
        // RequestIdentity address cannot be null.
        require(
            requestIdentity != address(0) && requestIdentity != SENTINEL_IDENTITIES,
            'Invalid requestIdentity address provided'
        );
        // No duplicate requestIdentities allowed.
        require(
            requestIdentities[requestIdentity] == address(0),
            'Address is already an requestIdentity'
        );
        requestIdentities[requestIdentity] = requestIdentities[SENTINEL_IDENTITIES];
        requestIdentities[SENTINEL_IDENTITIES] = requestIdentity;
        requestIdentityCount++;
        emit AddedRequestIdentity(requestIdentity);
        // Change threshold if threshold was changed.
        if (threshold != _threshold) changeThreshold(_threshold);
    }

    /// @dev Allows to remove an requestIdentity from the Safe and update the threshold at the same time.
    ///      This can only be done by the owner.
    /// @param prevRequestIdentity RequestIdentity that pointed to the requestIdentity to be removed in the linked list
    /// @param requestIdentity RequestIdentity address to be removed.
    /// @param _threshold New threshold.
    function removeRequestIdentity(
        address prevRequestIdentity,
        address requestIdentity,
        uint256 _threshold
    ) public onlyOwner {
        // Only allow to remove an requestIdentity, if threshold can still be reached.
        require(
            requestIdentityCount - 1 >= _threshold,
            'New requestIdentity count needs to be larger than new threshold'
        );
        // Validate requestIdentity address and check that it corresponds to requestIdentity index.
        require(
            requestIdentity != address(0) && requestIdentity != SENTINEL_IDENTITIES,
            'Invalid requestIdentity address provided'
        );
        require(
            requestIdentities[prevRequestIdentity] == requestIdentity,
            'Invalid prevRequestIdentity, requestIdentity pair provided'
        );
        requestIdentities[prevRequestIdentity] = requestIdentities[requestIdentity];
        requestIdentities[requestIdentity] = address(0);
        requestIdentityCount--;
        emit RemovedRequestIdentity(requestIdentity);
        // Change threshold if threshold was changed.
        if (threshold != _threshold) changeThreshold(_threshold);
    }

    /// @dev Allows to swap/replace an requestIdentity from the Safe with another address.
    ///      This can only be done by owner.
    /// @param prevRequestIdentity RequestIdentity that pointed to the requestIdentity to be replaced in the linked list
    /// @param oldRequestIdentity RequestIdentity address to be replaced.
    /// @param newRequestIdentity New requestIdentity address.
    function swapRequestIdentity(
        address prevRequestIdentity,
        address oldRequestIdentity,
        address newRequestIdentity
    ) public onlyOwner {
        // RequestIdentity address cannot be null.
        require(
            newRequestIdentity != address(0) && newRequestIdentity != SENTINEL_IDENTITIES,
            'Invalid requestIdentity address provided'
        );
        // No duplicate requestIdentities allowed.
        require(
            requestIdentities[newRequestIdentity] == address(0),
            'Address is already an requestIdentity'
        );
        // Validate oldRequestIdentity address and check that it corresponds to requestIdentity index.
        require(
            oldRequestIdentity != address(0) && oldRequestIdentity != SENTINEL_IDENTITIES,
            'Invalid requestIdentity address provided'
        );
        require(
            requestIdentities[prevRequestIdentity] == oldRequestIdentity,
            'Invalid prevRequestIdentity, requestIdentity pair provided'
        );
        requestIdentities[newRequestIdentity] = requestIdentities[oldRequestIdentity];
        requestIdentities[prevRequestIdentity] = newRequestIdentity;
        requestIdentities[oldRequestIdentity] = address(0);
        emit RemovedRequestIdentity(oldRequestIdentity);
        emit AddedRequestIdentity(newRequestIdentity);
    }

    /// @dev Allows to update the number of required confirmations by Safe requestIdentities.
    ///      This can only be done by owner.
    /// @param _threshold New threshold.
    function changeThreshold(uint256 _threshold) public onlyOwner {
        // Validate that threshold is smaller than number of requestIdentities.
        require(
            _threshold <= requestIdentityCount,
            'Threshold cannot exceed requestIdentity count'
        );
        // There has to be at least one Safe requestIdentity.
        require(_threshold >= 1, 'Threshold needs to be greater than 0');
        threshold = _threshold;
        emit ChangedThreshold(threshold);
    }

    function getThreshold() public view returns (uint256) {
        return threshold;
    }

    /// @dev Allows to update the allowance to the parent identities.
    ///      This can only be done by owner.
    /// @param _allowParentIdentities new allow parent identities value
    function changeAllowParentIdentities(bool _allowParentIdentities) public onlyOwner {
        allowParentIdentities = _allowParentIdentities;
    }

    function getAllowParentIdentities() public view returns (bool) {
        return allowParentIdentities;
    }

    function isRequestIdentity(address requestIdentity) public view returns (bool) {
        return
            requestIdentity != SENTINEL_IDENTITIES &&
            requestIdentities[requestIdentity] != address(0);
    }

    /// @dev Returns array of requestIdentities.
    /// @return Array of Safe requestIdentities.
    function getRequestIdentities() public view returns (address[] memory) {
        address[] memory array = new address[](requestIdentityCount);

        // populate return array
        uint256 index = 0;
        address currentRequestIdentity = requestIdentities[SENTINEL_IDENTITIES];
        while (currentRequestIdentity != SENTINEL_IDENTITIES) {
            array[index] = currentRequestIdentity;
            currentRequestIdentity = requestIdentities[currentRequestIdentity];
            index++;
        }
        return array;
    }
}
