import {DatasetUnified} from '../../core/models/dataset-unified';
import * as Brain from 'brain.js';
import {LoggerService} from './logger.service';
import {Injectable} from '@nestjs/common';
import {
  NeuralNetworkInput,
  NeutralNetworkDatasetService,
} from './neutral-network-dataset.service';
import {INeuralNetworkJSON} from 'brain.js/dist/neural-network';

@Injectable()
export class NeutralNetworkService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly network: Brain.NeuralNetwork<NeuralNetworkInput, any>;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly neutralNetworkDatasetService: NeutralNetworkDatasetService
  ) {
    this.network = new Brain.NeuralNetwork({
      log: status => {
        this.loggerService.debug(
          `Training: ${status.iterations} -- Error: ${status.error}`
        );
      },
    });
  }

  public train(dataset: DatasetUnified[]): void {
    this.network.train(
      dataset.map(data => ({
        input: this.neutralNetworkDatasetService.getNeuralNetworkInput(
          new Date(data.date)
        ),
        output: this.neutralNetworkDatasetService.getNeuralNetworkOutput(data),
      }))
    );

    this.loggerService.debug(
      `Network JSON ${JSON.stringify(this.network.toJSON())}`
    );
  }

  public load(json: unknown): void {
    this.network.fromJSON(json as INeuralNetworkJSON);
  }

  public forecast(date: Date): number[] {
    const result = this.network.run({
      dd: date.getDate(),
      mm: date.getMonth(),
      yyyy: date.getFullYear(),
    });
    this.loggerService.debug(`Raw network forecast ${result}`);

    const forecast = [];
    for (const number in result) {
      forecast.push([number, result[number]]);
    }

    const sortedForecast = forecast.sort((a, b) => {
      return a[1] - b[1];
    });
    this.loggerService.debug(`Sort forecast ${sortedForecast}`);

    return sortedForecast.slice(sortedForecast.length - 5).map(x => x[0]);
  }
}
