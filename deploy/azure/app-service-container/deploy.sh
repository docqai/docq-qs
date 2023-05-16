
NAME="${1:-"docq"}"
PREFIX="${NAME}$(( $RANDOM % 90 + 10))"
LOCATION="${2:-"westeurope"}"


# CPU_CORE_COUNT="${3:-"2"}"
# MEMORY_IN_GB="${4:-"4"}"

# RESOURCE_GROUP="${PREFIX}-rg"
RESOURCE_GROUP="docq11-rg"
# STORAGE_ACCOUNT="${PREFIX}sa"
# BLOB_STORAGE_NAME="${PREFIX}blob"
# FILE_STORAGE_NAME="${PREFIX}file"
# CONTAINER_GROUP="${PREFIX}cg"

#az group create --name $RESOURCE_GROUP --location $LOCATION
#az configure --defaults group=$RESOURCE_GROUP location=$LOCATION

az deployment group create --template-file template.json --parameters '@parameters.json'
