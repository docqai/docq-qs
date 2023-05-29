reponame := docqai/hazyresearch-huggingface

build-image:
	docker image build . -t ${reponame}:latest

run-image:
# default huggingface model. override --entrypoint to run other models. See https://github.com/HazyResearch/manifest#other-models
	docker run ${reponame}:latest

publish-image:
	docker push ${reponame}:latest

create-ecr-repo:
# note public repo must have region us-east-1. Only need to run this if the repo does not exist
	aws ecr-public get-login-password --region us-east-1 --profile fabrexp | docker login --username AWS --password-stdin public.ecr.aws/q0o2r1k7
	aws ecr-public create-repository --repository-name ${reponame} --region us-east-1 --profile fabrexp

publish-image-ecr:
# publishes to public ECR repo in the FABR Exp account
	aws ecr-public get-login-password --region us-east-1 --profile fabrexp | docker login --username AWS --password-stdin public.ecr.aws/q0o2r1k7
	docker tag ${reponame}:latest public.ecr.aws/q0o2r1k7/${reponame}:latest
	docker push public.ecr.aws/q0o2r1k7/${reponame}:latest
	docker logout public.ecr.aws/q0o2r1k7