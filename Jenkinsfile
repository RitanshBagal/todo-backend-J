pipeline {
     agent any 
     environment {
         PROJECT_NAME = "todo-backend" 
         DOCKER_IMAGE = "ritanshbagal/todo-backend" 
         DOCKER_TAG = "${BUILD_NUMBER}" } 
         stages { 

            stage("Checkout"){
                steps{
                    checkout scm
                    echo "checkout successful"
                    echo "Testing from github...."
                }
            }
            
            stage("Test"){
                steps{
                    sh '''
                    chmod +x ./mvnw
                    ./mvnw test
                    '''
                }
            }

            stage("Build"){
                steps{
                    sh '''
                    ./mvnw clean package -DskipTests
                    '''
                }
            }

            stage("Docker Build"){
                steps{
                    sh '''
                    docker build \
                    -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                    '''
                }
            }
        } 
}